import type { Metadata } from "next";
import { AddressBook, ProfileForm } from "@/components/account/AccountForms";
import { getProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { mapAddress, type AddressRow } from "@/services/mappers";

export const metadata: Metadata = { title: "Profile and addresses", robots: { index: false } };

export default async function ProfilePage() {
  const profile = await getProfile();
  if (!profile) return null;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("addresses")
    .select("id, full_name, phone, line1, line2, area, city, state, pincode, landmark, is_default")
    .order("is_default", { ascending: false })
    .order("created_at");
  const addresses = ((data ?? []) as AddressRow[]).map(mapAddress);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Profile</h1>
        <div className="mt-5">
          <ProfileForm fullName={profile.fullName ?? ""} phone={profile.phone ?? ""} email={profile.email ?? ""} />
        </div>
      </section>
      <section>
        <h2 className="font-display text-2xl font-extrabold">Saved addresses</h2>
        <div className="mt-4">
          <AddressBook addresses={addresses} />
        </div>
      </section>
    </div>
  );
}
