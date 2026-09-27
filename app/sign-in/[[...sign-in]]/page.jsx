import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="min-h-screen grid md:grid-cols-2">
      <section className="hidden md:flex flex-col justify-between bg-espresso text-white p-10">
        <div className="ankara-band -mx-10 -mt-10" />
        <div>
          <p className="text-gold text-lg">Threads &amp; Gems</p>
          <h1 className="text-4xl font-light mt-2 max-w-sm leading-tight">Store admin</h1>
          <p className="text-stone-300 mt-4 max-w-sm">
            Manage orders, products and customers for the shop.
          </p>
        </div>
        <p className="text-stone-400 text-sm">Staff access only.</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <SignIn appearance={{ variables: { colorPrimary: '#C9A84C' } }} />
      </section>
    </main>
  );
}
