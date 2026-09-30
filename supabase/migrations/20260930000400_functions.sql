-- Transactional business functions. Callable only by the service role unless stated.
-- See docs/ARCHITECTURE.md (Inventory, Payments flow) and docs/DECISIONS.md ADR-005.

-- ---------------------------------------------------------------------------
-- Order timeline + timestamps
-- Functions set app.event_message / app.event_actor before changing status so the
-- trigger can record a meaningful event. Direct admin updates fall back to defaults.
-- ---------------------------------------------------------------------------
create or replace function public.orders_status_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'DELIVERED' and new.delivered_at is null then
      new.delivered_at := now();
    end if;
    if new.status = 'CANCELLED' and new.cancelled_at is null then
      new.cancelled_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger orders_status_timestamps
before update of status on public.orders
for each row execute function public.orders_status_timestamps();

create or replace function public.orders_record_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message text := nullif(current_setting('app.event_message', true), '');
  v_actor text := coalesce(nullif(current_setting('app.event_actor', true), ''), 'system');
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, status, message, actor)
    values (new.id, new.status, coalesce(v_message, 'Order placed'), v_actor);
  elsif new.status is distinct from old.status then
    if v_actor not in ('system', 'customer', 'admin', 'payment', 'shipping') then
      v_actor := 'system';
    end if;
    insert into public.order_events (order_id, status, message, actor)
    values (new.id, new.status, v_message, v_actor);
  end if;
  return null;
end;
$$;

revoke execute on function public.orders_record_event() from public, anon, authenticated;

create trigger orders_record_event
after insert or update of status on public.orders
for each row execute function public.orders_record_event();

create or replace function public._set_event_context(p_message text, p_actor text)
returns void
language sql
set search_path = ''
as $$
  select set_config('app.event_message', coalesce(p_message, ''), true),
         set_config('app.event_actor', coalesce(p_actor, 'system'), true);
$$;

-- ---------------------------------------------------------------------------
-- Inventory helpers (internal)
-- ---------------------------------------------------------------------------

-- Moves reserved units to sold: quantity -= q, reserved -= q.
create or replace function public._commit_reserved_inventory(p_order_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.inventory i
  set quantity = greatest(i.quantity - x.qty, 0),
      reserved = greatest(i.reserved - x.qty, 0)
  from (
    select product_id, sum(quantity)::int as qty
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) x
  where i.product_id = x.product_id;
end;
$$;

-- Returns reserved units to available stock.
create or replace function public._release_reserved_inventory(p_order_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.inventory i
  set reserved = greatest(i.reserved - x.qty, 0)
  from (
    select product_id, sum(quantity)::int as qty
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) x
  where i.product_id = x.product_id;
end;
$$;

-- Puts sold units back on the shelf (cancellation/return after commit).
create or replace function public._restock_committed_inventory(p_order_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.inventory i
  set quantity = i.quantity + x.qty
  from (
    select product_id, sum(quantity)::int as qty
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) x
  where i.product_id = x.product_id;
end;
$$;

-- Tries to take stock directly (used when a payment arrives after the reservation expired).
-- Returns false if any line cannot be fulfilled; lines that can are still taken.
create or replace function public._take_inventory_now(p_order_id uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_line record;
  v_ok boolean := true;
  v_rows integer;
begin
  for v_line in
    select product_id, sum(quantity)::int as qty
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  loop
    update public.inventory
    set quantity = quantity - v_line.qty
    where product_id = v_line.product_id and quantity - reserved >= v_line.qty;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      v_ok := false;
    end if;
  end loop;
  return v_ok;
end;
$$;

create or replace function public._record_coupon_usage(p_order_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.coupon_usage (coupon_id, order_id, user_id, customer_email, customer_phone, discount_paise)
  select o.coupon_id, o.id, o.user_id, lower(o.customer_email), o.customer_phone, o.discount_paise
  from public.orders o
  where o.id = p_order_id and o.coupon_id is not null
  on conflict (order_id) do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- place_order: inserts order + items and reserves stock in one transaction.
-- Amounts are computed by the server (src/services/pricing.ts) from DB prices; this
-- function re-checks each unit price against the product row to catch races.
-- Idempotent on idempotency_key.
-- ---------------------------------------------------------------------------
create or replace function public.place_order(p_order jsonb, p_items jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_existing public.orders%rowtype;
  v_order_id uuid;
  v_access_token uuid;
  v_order_number text;
  v_method public.payment_method := (p_order ->> 'payment_method')::public.payment_method;
  v_item jsonb;
  v_qty integer;
  v_product public.products%rowtype;
  v_rows integer;
  v_attempt integer := 0;
  v_status public.order_status;
begin
  if nullif(p_order ->> 'idempotency_key', '') is not null then
    select * into v_existing from public.orders where idempotency_key = p_order ->> 'idempotency_key';
    if found then
      return jsonb_build_object(
        'id', v_existing.id, 'order_number', v_existing.order_number,
        'access_token', v_existing.access_token, 'status', v_existing.status,
        'total_paise', v_existing.total_paise, 'created', false
      );
    end if;
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART' using errcode = 'P0001';
  end if;

  loop
    v_order_number := 'AL' || to_char(now() at time zone 'Asia/Kolkata', 'YYMMDD') || '-'
      || upper(substr(md5(gen_random_uuid()::text), 1, 5));
    exit when not exists (select 1 from public.orders where order_number = v_order_number);
    v_attempt := v_attempt + 1;
    if v_attempt > 5 then
      raise exception 'ORDER_NUMBER_COLLISION' using errcode = 'P0001';
    end if;
  end loop;

  v_status := case when v_method = 'cod' then 'PROCESSING' else 'PENDING_PAYMENT' end;

  perform public._set_event_context(
    case when v_method = 'cod' then 'Order placed (cash on delivery)' else 'Order placed, awaiting payment' end,
    'customer'
  );

  insert into public.orders (
    order_number, idempotency_key, user_id, status, payment_method, payment_status, inventory_state,
    customer_name, customer_email, customer_phone, shipping_address, shipping_pincode, shipping_method,
    subtotal_paise, discount_paise, shipping_paise, cod_fee_paise, tax_paise, total_paise,
    tax_rate_bps, prices_include_tax, coupon_id, coupon_code, customer_note, expires_at
  ) values (
    v_order_number,
    nullif(p_order ->> 'idempotency_key', ''),
    nullif(p_order ->> 'user_id', '')::uuid,
    v_status,
    v_method,
    case when v_method = 'cod' then 'cod_pending'::public.payment_status else 'created'::public.payment_status end,
    'reserved',
    p_order ->> 'customer_name',
    lower(p_order ->> 'customer_email'),
    p_order ->> 'customer_phone',
    p_order -> 'shipping_address',
    p_order ->> 'shipping_pincode',
    coalesce(p_order ->> 'shipping_method', 'standard'),
    (p_order ->> 'subtotal_paise')::integer,
    coalesce((p_order ->> 'discount_paise')::integer, 0),
    coalesce((p_order ->> 'shipping_paise')::integer, 0),
    coalesce((p_order ->> 'cod_fee_paise')::integer, 0),
    coalesce((p_order ->> 'tax_paise')::integer, 0),
    (p_order ->> 'total_paise')::integer,
    coalesce((p_order ->> 'tax_rate_bps')::integer, 0),
    coalesce((p_order ->> 'prices_include_tax')::boolean, true),
    nullif(p_order ->> 'coupon_id', '')::uuid,
    nullif(p_order ->> 'coupon_code', ''),
    nullif(p_order ->> 'customer_note', ''),
    case when v_method = 'online'
      then now() + make_interval(mins => coalesce((p_order ->> 'payment_window_minutes')::integer, 30))
    end
  )
  returning id, access_token into v_order_id, v_access_token;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 then
      raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
    end if;

    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid for share;
    if not found or v_product.status <> 'published' then
      raise exception 'PRODUCT_UNAVAILABLE:%', v_item ->> 'product_id' using errcode = 'P0001';
    end if;
    if v_product.price_paise is null or v_product.price_paise <> (v_item ->> 'unit_price_paise')::integer then
      raise exception 'PRICE_CHANGED:%', v_product.id using errcode = 'P0001';
    end if;

    update public.inventory
    set reserved = reserved + v_qty
    where product_id = v_product.id and (allow_backorder or quantity - reserved >= v_qty);
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      raise exception 'INSUFFICIENT_STOCK:%', v_product.id using errcode = 'P0001';
    end if;

    insert into public.order_items (
      order_id, product_id, title, slug, sku, isbn, cover_url,
      unit_price_paise, unit_mrp_paise, quantity, line_total_paise
    ) values (
      v_order_id, v_product.id, v_product.title, v_product.slug, v_product.sku, v_product.isbn,
      nullif(v_item ->> 'cover_url', ''),
      v_product.price_paise, v_product.mrp_paise, v_qty, v_product.price_paise * v_qty
    );
  end loop;

  if v_method = 'cod' then
    perform public._commit_reserved_inventory(v_order_id);
    update public.orders set inventory_state = 'committed' where id = v_order_id;
    perform public._record_coupon_usage(v_order_id);
  end if;

  insert into public.payments (order_id, provider, method, status, amount_paise)
  values (
    v_order_id,
    case when v_method = 'cod' then 'cod' else coalesce(p_order ->> 'payment_provider', 'razorpay') end,
    v_method,
    case when v_method = 'cod' then 'cod_pending'::public.payment_status else 'created'::public.payment_status end,
    (p_order ->> 'total_paise')::integer
  );

  return jsonb_build_object(
    'id', v_order_id, 'order_number', v_order_number, 'access_token', v_access_token,
    'status', v_status, 'total_paise', (p_order ->> 'total_paise')::integer, 'created', true
  );
end;
$$;

-- Links the gateway's order id to our payment row (called after the gateway order is created).
create or replace function public.attach_provider_order(p_order_id uuid, p_provider text, p_provider_order_id text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.payments
  set provider = p_provider, provider_order_id = p_provider_order_id
  where order_id = p_order_id and method = 'online' and status in ('created', 'failed')
    and (provider_order_id is null or provider_order_id = p_provider_order_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- finalize_paid_order: idempotent. Safe to call from both the browser callback and the
-- webhook; only the first call changes state.
-- ---------------------------------------------------------------------------
create or replace function public.finalize_paid_order(
  p_order_id uuid,
  p_provider text,
  p_provider_order_id text,
  p_provider_payment_id text,
  p_amount_paise integer,
  p_raw jsonb default null
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_stock_ok boolean := true;
  v_rows integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;

  update public.payments
  set status = 'captured',
      provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
      amount_paise = p_amount_paise,
      raw = coalesce(p_raw, raw),
      error_code = null,
      error_description = null
  where order_id = p_order_id and provider = p_provider and provider_order_id = p_provider_order_id
    and status <> 'refunded';
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    insert into public.payments (order_id, provider, method, status, amount_paise, provider_order_id, provider_payment_id, raw)
    values (p_order_id, p_provider, 'online', 'captured', p_amount_paise, p_provider_order_id, p_provider_payment_id, p_raw)
    on conflict do nothing;
  end if;

  if v_order.payment_status = 'captured' then
    return jsonb_build_object('finalized', false, 'reason', 'already_paid', 'status', v_order.status);
  end if;

  if p_amount_paise < v_order.total_paise then
    update public.orders set needs_attention = true,
      admin_note = concat_ws(E'\n', admin_note, 'Captured amount ' || p_amount_paise || ' is below order total ' || v_order.total_paise)
    where id = p_order_id;
    return jsonb_build_object('finalized', false, 'reason', 'amount_mismatch', 'status', v_order.status);
  end if;

  if v_order.inventory_state = 'reserved' then
    perform public._commit_reserved_inventory(p_order_id);
  elsif v_order.inventory_state = 'released' then
    v_stock_ok := public._take_inventory_now(p_order_id);
  end if;

  perform public._set_event_context('Payment confirmed', 'payment');

  update public.orders
  set status = case when status in ('PENDING_PAYMENT', 'CANCELLED') then 'PAID'::public.order_status else status end,
      payment_status = 'captured',
      inventory_state = 'committed',
      paid_at = now(),
      expires_at = null,
      cancel_reason = null,
      cancelled_at = null,
      needs_attention = needs_attention or not v_stock_ok,
      admin_note = case when v_stock_ok then admin_note
        else concat_ws(E'\n', admin_note, 'Paid after reservation expired and stock was insufficient for at least one item.') end
  where id = p_order_id;

  perform public._record_coupon_usage(p_order_id);

  return jsonb_build_object('finalized', true, 'needs_attention', not v_stock_ok, 'status', 'PAID');
end;
$$;

-- Records a failed payment attempt. The order stays PENDING_PAYMENT so the customer can retry.
create or replace function public.mark_payment_failed(
  p_provider text,
  p_provider_order_id text,
  p_provider_payment_id text,
  p_error_code text,
  p_error_description text
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_order_id uuid;
begin
  update public.payments
  set status = 'failed',
      provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
      error_code = left(p_error_code, 100),
      error_description = left(p_error_description, 500)
  where provider = p_provider and provider_order_id = p_provider_order_id and status in ('created', 'failed')
  returning order_id into v_order_id;

  if v_order_id is not null then
    insert into public.order_events (order_id, message, actor)
    values (v_order_id, 'Payment attempt failed', 'payment');
  end if;
  return v_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- cancel_order: releases reservations; optionally restocks committed units.
-- Refunds are handled separately through the payment provider.
-- ---------------------------------------------------------------------------
create or replace function public.cancel_order(p_order_id uuid, p_reason text, p_actor text, p_restock boolean default true)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_new_state public.inventory_state;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_order.status in ('SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURN_REQUESTED', 'RETURNED') then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;

  v_new_state := v_order.inventory_state;
  if v_order.inventory_state = 'reserved' then
    perform public._release_reserved_inventory(p_order_id);
    v_new_state := 'released';
  elsif v_order.inventory_state = 'committed' and p_restock then
    perform public._restock_committed_inventory(p_order_id);
    v_new_state := 'released';
  end if;

  perform public._set_event_context(coalesce(p_reason, 'Order cancelled'), p_actor);

  update public.orders
  set status = 'CANCELLED',
      cancel_reason = left(p_reason, 300),
      inventory_state = v_new_state,
      expires_at = null
  where id = p_order_id;

  return jsonb_build_object('cancelled', true, 'payment_status', v_order.payment_status);
end;
$$;

-- Cancels unpaid online orders whose payment window has passed. Returns the number cancelled.
create or replace function public.expire_pending_orders()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  for v_id in
    select id from public.orders
    where status = 'PENDING_PAYMENT' and expires_at < now()
    order by expires_at
    limit 500
    for update skip locked
  loop
    perform public.cancel_order(v_id, 'Payment not completed in time', 'system', true);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Records a refund (from the admin action or the payment webhook). Idempotent per refund total.
create or replace function public.record_refund(p_order_id uuid, p_refunded_total_paise integer, p_note text)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_full boolean;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;

  v_full := p_refunded_total_paise >= v_order.total_paise;

  update public.payments
  set refunded_paise = greatest(refunded_paise, p_refunded_total_paise),
      status = case when v_full then 'refunded'::public.payment_status else 'partially_refunded'::public.payment_status end
  where order_id = p_order_id and method = 'online' and status in ('captured', 'partially_refunded', 'refunded');

  update public.orders
  set payment_status = case when v_full then 'refunded'::public.payment_status else 'partially_refunded'::public.payment_status end
  where id = p_order_id;

  if v_full and v_order.status <> 'REFUNDED' then
    perform public._set_event_context(coalesce(p_note, 'Refund processed'), 'payment');
    update public.orders set status = 'REFUNDED' where id = p_order_id;
  else
    insert into public.order_events (order_id, message, actor)
    values (p_order_id, coalesce(p_note, 'Partial refund processed'), 'payment');
  end if;

  return jsonb_build_object('full', v_full);
end;
$$;

-- Status change with a timeline message (used by admin and shipping sync on the server).
create or replace function public.set_order_status(p_order_id uuid, p_status public.order_status, p_message text, p_actor text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform public._set_event_context(p_message, p_actor);
  update public.orders set status = p_status where id = p_order_id and status is distinct from p_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- Rate limiting (fixed window). Returns true when the call is allowed.
-- ---------------------------------------------------------------------------
create or replace function public.rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count integer;
begin
  insert into public.rate_limits (key, window_start, count)
  values (left(p_key, 200), v_window, 1)
  on conflict (key, window_start) do update set count = public.rate_limits.count + 1
  returning count into v_count;

  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_limit;
end;
$$;

-- ---------------------------------------------------------------------------
-- Search (security invoker: RLS applies, so only published products are returned)
-- ---------------------------------------------------------------------------
create or replace function public.search_product_ids(p_query text, p_limit integer default 12, p_offset integer default 0)
returns table (product_id uuid, rank real, total_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with cleaned as (
    select trim(regexp_replace(lower(coalesce(p_query, '')), '[^[:alnum:][:space:]]+', ' ', 'g')) as text
  ),
  q as (
    select
      case when c.text = '' then null
        else to_tsquery('simple', (
          select string_agg(quote_literal(w) || ':*', ' & ')
          from regexp_split_to_table(c.text, '\s+') as w
          where w <> ''
        ))
      end as tsq,
      '%' || c.text || '%' as pattern,
      regexp_replace(coalesce(p_query, ''), '[^0-9Xx]', '', 'g') as isbn_digits
    from cleaned c
  ),
  matches as (
    select
      p.id,
      coalesce(ts_rank(p.search_vector, q.tsq), 0)
        + case when lower(p.title) like q.pattern then 1 else 0 end as rank
    from public.products p cross join q
    where p.status = 'published'
      and q.tsq is not null
      and (
        p.search_vector @@ q.tsq
        or lower(p.title) like q.pattern
        or lower(coalesce(p.author, '')) like q.pattern
        or (length(q.isbn_digits) >= 10 and replace(coalesce(p.isbn, ''), '-', '') = q.isbn_digits)
        or exists (
          select 1 from public.product_categories pc
          join public.categories c on c.id = pc.category_id
          where pc.product_id = p.id and lower(c.name) like q.pattern
        )
      )
  )
  select m.id, m.rank::real, count(*) over ()
  from matches m
  order by m.rank desc, m.id
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
$$;

-- ---------------------------------------------------------------------------
-- Ratings: keep products.rating_avg / rating_count in sync with approved reviews
-- ---------------------------------------------------------------------------
create or replace function public.reviews_refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
  set rating_avg = coalesce(r.avg_rating, 0),
      rating_count = coalesce(r.cnt, 0)
  from (
    select round(avg(rating)::numeric, 2) as avg_rating, count(*)::int as cnt
    from public.reviews
    where product_id = v_product and status = 'approved'
  ) r
  where p.id = v_product;
  return null;
end;
$$;

revoke execute on function public.reviews_refresh_product_rating() from public, anon, authenticated;

create trigger reviews_refresh_product_rating
after insert or update or delete on public.reviews
for each row execute function public.reviews_refresh_product_rating();

-- ---------------------------------------------------------------------------
-- Admin analytics (service role)
-- ---------------------------------------------------------------------------
create or replace function public.sales_summary(p_since timestamptz)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'revenue_paise', coalesce(sum(total_paise) filter (
      where status in ('PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED')), 0),
    'orders', count(*) filter (where status <> 'PENDING_PAYMENT' and status <> 'CANCELLED'),
    'pending_payment', count(*) filter (where status = 'PENDING_PAYMENT'),
    'paid', count(*) filter (where status = 'PAID'),
    'processing', count(*) filter (where status in ('PROCESSING', 'PACKED')),
    'shipped', count(*) filter (where status in ('SHIPPED', 'OUT_FOR_DELIVERY')),
    'delivered', count(*) filter (where status = 'DELIVERED'),
    'cancelled', count(*) filter (where status = 'CANCELLED'),
    'needs_attention', count(*) filter (where needs_attention)
  )
  from public.orders
  where created_at >= p_since;
$$;

create or replace function public.daily_revenue(p_days integer)
returns table (day date, revenue_paise bigint, orders bigint)
language sql
stable
set search_path = ''
as $$
  select d::date as day,
         coalesce(sum(o.total_paise), 0)::bigint,
         count(o.id)::bigint
  from generate_series(
    (now() at time zone 'Asia/Kolkata')::date - (p_days - 1),
    (now() at time zone 'Asia/Kolkata')::date,
    interval '1 day'
  ) d
  left join public.orders o
    on (o.created_at at time zone 'Asia/Kolkata')::date = d::date
   and o.status in ('PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED')
  group by d
  order by d;
$$;

create or replace function public.best_sellers(p_limit integer, p_since timestamptz)
returns table (product_id uuid, title text, units bigint, revenue_paise bigint)
language sql
stable
set search_path = ''
as $$
  select oi.product_id, max(oi.title), sum(oi.quantity)::bigint, sum(oi.line_total_paise)::bigint
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.status in ('PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED')
    and o.created_at >= p_since
    and oi.product_id is not null
  group by oi.product_id
  order by 3 desc
  limit p_limit;
$$;

-- ---------------------------------------------------------------------------
-- Execute permissions
-- ---------------------------------------------------------------------------
revoke execute on function
  public._set_event_context(text, text),
  public._commit_reserved_inventory(uuid),
  public._release_reserved_inventory(uuid),
  public._restock_committed_inventory(uuid),
  public._take_inventory_now(uuid),
  public._record_coupon_usage(uuid),
  public.place_order(jsonb, jsonb),
  public.attach_provider_order(uuid, text, text),
  public.finalize_paid_order(uuid, text, text, text, integer, jsonb),
  public.mark_payment_failed(text, text, text, text, text),
  public.cancel_order(uuid, text, text, boolean),
  public.expire_pending_orders(),
  public.record_refund(uuid, integer, text),
  public.set_order_status(uuid, public.order_status, text, text),
  public.rate_limit_hit(text, integer, integer),
  public.sales_summary(timestamptz),
  public.daily_revenue(integer),
  public.best_sellers(integer, timestamptz),
  public.orders_status_timestamps(),
  public.products_search_vector_refresh(),
  public.products_create_inventory(),
  public.set_updated_at()
from public, anon, authenticated;

grant execute on function
  public.place_order(jsonb, jsonb),
  public.attach_provider_order(uuid, text, text),
  public.finalize_paid_order(uuid, text, text, text, integer, jsonb),
  public.mark_payment_failed(text, text, text, text, text),
  public.cancel_order(uuid, text, text, boolean),
  public.expire_pending_orders(),
  public.record_refund(uuid, integer, text),
  public.set_order_status(uuid, public.order_status, text, text),
  public.rate_limit_hit(text, integer, integer),
  public.sales_summary(timestamptz),
  public.daily_revenue(integer),
  public.best_sellers(integer, timestamptz)
to service_role;

-- Internal helpers are only called from the functions above (which run as the caller);
-- service_role needs execute on them too.
grant execute on function
  public._set_event_context(text, text),
  public._commit_reserved_inventory(uuid),
  public._release_reserved_inventory(uuid),
  public._restock_committed_inventory(uuid),
  public._take_inventory_now(uuid),
  public._record_coupon_usage(uuid)
to service_role;

grant execute on function public.search_product_ids(text, integer, integer) to anon, authenticated, service_role;
