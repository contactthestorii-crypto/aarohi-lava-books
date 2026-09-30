-- Initial store data. Only facts visible on the supplied cover or given by the owner.
-- Unknown values (price, MRP, ISBN, pages, weight, dimensions, binding, stock) stay NULL/0
-- until the publisher enters them in the admin (docs/PRD.md content rules).

-- ---------------------------------------------------------------------------
-- Settings (all editable in /admin/settings)
-- ---------------------------------------------------------------------------
insert into public.settings (key, value) values
  ('store', jsonb_build_object(
    'name', 'Aarohi Lava Publications',
    'short_name', 'Aarohi Lava',
    'tagline', 'Books for Telangana competitive exams',
    'support_email', '',
    'support_phone', '',
    'whatsapp', '',
    'address', '',
    'business_hours', ''
  )),
  ('home', jsonb_build_object(
    'hero_title', 'Prepare smarter. Score better.',
    'hero_subtitle', 'Exam-focused books and previous question papers for TSLPRB, TGPSC and other competitive examinations.'
  )),
  -- Shipping fee shown at checkout. Review before launch (admin setup checklist flags this).
  ('shipping', jsonb_build_object(
    'flat_fee_paise', 0,
    'free_above_paise', null,
    'delivery_note', '',
    'reviewed', false
  )),
  ('cod', jsonb_build_object(
    'enabled', false,
    'fee_paise', 0,
    'max_order_paise', null
  )),
  -- Printed books are generally GST-exempt in India; confirm with your CA before enabling.
  ('tax', jsonb_build_object(
    'enabled', false,
    'rate_bps', 0,
    'prices_include_tax', true,
    'label', 'GST',
    'gstin', ''
  )),
  ('checkout', jsonb_build_object(
    'allow_guest', true
  )),
  ('reviews', jsonb_build_object(
    'moderation', true,
    'verified_only', false
  )),
  ('orders', jsonb_build_object(
    'auto_create_shipment', false
  ))
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Categories (owner-provided initial list)
-- ---------------------------------------------------------------------------
insert into public.categories (slug, name, kind, sort_order, description) values
  ('tslprb', 'TSLPRB', 'exam', 10, 'Telangana State Level Police Recruitment Board exams.'),
  ('tgpsc', 'TGPSC', 'exam', 20, 'Telangana Public Service Commission exams.'),
  ('police-exams', 'Police Exams', 'exam', 30, null),
  ('competitive-exams', 'Competitive Exams', 'exam', 40, null),
  ('general-studies', 'General Studies', 'type', 10, null),
  ('previous-question-papers', 'Previous Question Papers', 'type', 20, null),
  ('telangana-history', 'Telangana History', 'subject', 10, null),
  ('telangana-movement', 'Telangana Movement', 'subject', 20, null),
  ('indian-polity', 'Indian Polity', 'subject', 30, null),
  ('economy', 'Economy', 'subject', 40, null),
  ('geography', 'Geography', 'subject', 50, null),
  ('science-technology', 'Science & Technology', 'subject', 60, null),
  ('environment', 'Environment', 'subject', 70, null),
  ('current-affairs', 'Current Affairs', 'subject', 80, null),
  ('telangana-culture', 'Telangana Culture', 'subject', 90, null),
  ('heritage-arts', 'Heritage & Arts', 'subject', 100, null)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Initial product: Target Police (facts from the cover only)
-- ---------------------------------------------------------------------------
insert into public.products (
  slug, title, subtitle, author, author_bio, publisher, edition, exams, keywords,
  description, key_features, exam_coverage, status, is_featured, primary_category_id,
  seo_title, seo_description
) values (
  'target-police-general-studies-tslprb-tgpsc',
  'Target Police: 360° Explanation of General Studies',
  'Previous Question Papers',
  'Swathylava Neralla',
  'Swathylava Neralla (MSc, MA) is the author of Target Police.',
  'Aarohi Lava Publications',
  'Updated with 2026 data',
  array['TSLPRB', 'TGPSC'],
  array['police', 'sub inspector', 'SI', 'general studies', 'previous papers', 'PYQ', 'Telangana', 'prelims', 'mains'],
  'Target Police covers all Telangana Sub Inspector previous question papers (Prelims and Mains) with a 360° explanation of General Studies. Written for TSLPRB, TGPSC and other competitive exams, and updated with 2026 data.',
  array[
    'All Telangana Sub Inspector previous question papers (Prelims & Mains) explained in 360°',
    'Covers the complete TSLPRB syllabus with an exam-oriented approach',
    'Includes Central & State Budgets 2026-27 with key highlights and probable questions',
    'Includes Telangana Socio Economic Survey 2026 with charts, facts and analysis',
    'Includes 2026 Nobel Awards, Padma Awards, Gaddar Awards and other important awards',
    'Answers linked with latest current affairs (reports, surveys, indexes, schemes, committees)',
    'Aspirant friendly: concise, exam-oriented explanations that save time',
    'Previous questions arranged topic-wise',
    'Concept clarity with tables, maps, diagrams and PYQ trends',
    'Useful for TSLPRB, TGPSC and other state and central exams'
  ],
  array[
    'History', 'Telangana Movement', 'Polity', 'Economy', 'Geography', 'Indian Society',
    'Science & Technology', 'Environment & Ecology', 'Current Affairs',
    'Telangana Culture, Heritage & Arts'
  ],
  'published',
  true,
  (select id from public.categories where slug = 'tslprb'),
  'Target Police: General Studies Previous Papers for TSLPRB, TGPSC',
  'All Telangana SI previous question papers (Prelims & Mains) with 360° explanations of General Studies. Updated with 2026 data.'
)
on conflict (slug) do nothing;

insert into public.product_categories (product_id, category_id)
select p.id, c.id
from public.products p
join public.categories c on c.slug in (
  'tslprb', 'tgpsc', 'police-exams', 'competitive-exams', 'general-studies', 'previous-question-papers'
)
where p.slug = 'target-police-general-studies-tslprb-tgpsc'
on conflict do nothing;

-- No product photo is seeded: the storefront renders the book from its data until the
-- publisher uploads real product photos in the admin.

-- ---------------------------------------------------------------------------
-- FAQs describing how the store works (editable in /admin/faqs)
-- ---------------------------------------------------------------------------
insert into public.faqs (question, answer, sort_order) values
  ('How do I track my order?',
   'Open Track order and enter your order ID with the phone number or email you used at checkout. Signed-in customers can also see every order under My account.', 10),
  ('Which payment methods can I use?',
   'Online payments are processed securely by Razorpay, which supports UPI, debit and credit cards, net banking and wallets. Cash on delivery is shown at checkout when it is available for your order.', 20),
  ('Do I need an account to order?',
   'No. You can check out as a guest. Creating an account lets you save addresses and see your order history in one place.', 30),
  ('Will I get a confirmation?',
   'Yes. After your order is placed you see a confirmation page with your order ID, and a confirmation email is sent to the address you entered.', 40);
