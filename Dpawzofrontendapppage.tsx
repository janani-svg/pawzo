import Link from "next/link";

/* PAWZO landing page (/) — SCREEN_FLOW §2.1.
   Built from documented tokens only: Inter/Poppins, the 16-color palette,
   documented Button / Card / Badge components, 8px grid, brand voice. */

/* ---- Line icons (Feather-style, 2px stroke, round caps — DESIGN_SYSTEM §11.1) ---- */
type IconProps = { className?: string };

function HeartPulseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M20.8 8.6a4.6 4.6 0 0 0-8-3 4.6 4.6 0 0 0-8 3c0 1.3.5 2.5 1.4 3.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 12.5h3l1.5-3 2.5 6 2-4 1.3 2.2H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.8 13.2 12 19.8l-2.2-2.1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BowlIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 11h18a9 9 0 0 1-18 0Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M5.5 16.5h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M9 7.5c0-1.4.7-2.5 1.6-2.5M14.8 8c.4-1.3 0-2.6-.9-2.9M12 8c0-2 .4-3.5 1.2-3.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PillIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect
        x="3"
        y="8"
        width="18"
        height="8"
        rx="4"
        transform="rotate(-45 3 8)"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="m9.5 8.5 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 4v15a1 1 0 0 0 1 1h15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m7 14 3-3 3 2 4-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3c.6 3.7 1.8 4.9 5.5 5.5C13.8 9.1 12.6 10.3 12 14c-.6-3.7-1.8-4.9-5.5-5.5C10.2 7.9 11.4 6.7 12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M18 14c.3 1.8.9 2.4 2.7 2.7-1.8.3-2.4.9-2.7 2.7-.3-1.8-.9-2.4-2.7-2.7C17.1 16.4 17.7 15.8 18 14Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VetCrossIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 21s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 7.5v6M9 10.5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PawIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="6" cy="10" r="2" />
      <circle cx="10" cy="6" r="2" />
      <circle cx="14" cy="6" r="2" />
      <circle cx="18" cy="10" r="2" />
      <path d="M12 11c-2.6 0-4.7 2-4.7 4.4 0 1.7 1.4 2.6 3 2.6.7 0 1.1-.3 1.7-.3s1 .3 1.7.3c1.6 0 3-.9 3-2.6C16.7 13 14.6 11 12 11Z" />
    </svg>
  );
}

/* ---- Reusable bits ---- */
const FEATURES = [
  {
    icon: HeartPulseIcon,
    title: "Health dashboard",
    body: "A calendar hub for appointments, check-ups, and every health moment that matters.",
    bg: "var(--color-soft-sky)",
    fg: "var(--color-ocean)",
  },
  {
    icon: BowlIcon,
    title: "Feeding tracker",
    body: "Log meals and set schedules so no tummy goes rumbling. We'll nudge you when it's time.",
    bg: "var(--color-grass)",
    fg: "var(--color-sage)",
  },
  {
    icon: PillIcon,
    title: "Medication manager",
    body: "Track doses and frequencies, and get a gentle reminder before every one is due.",
    bg: "var(--color-blush)",
    fg: "var(--color-rose)",
  },
  {
    icon: ChartIcon,
    title: "Growth tracking",
    body: "Watch your buddy grow with weight and milestone charts that celebrate every step.",
    bg: "var(--color-minty)",
    fg: "var(--color-deep-blue)",
  },
  {
    icon: SparkleIcon,
    title: "AI assistant",
    body: "Ask anything about pet care and get warm, helpful guidance in seconds. 🐾",
    bg: "var(--color-lemon)",
    fg: "var(--color-deep-blue)",
  },
  {
    icon: VetCrossIcon,
    title: "Emergency vet finder",
    body: "Find a nearby vet and one-tap call for help — plus a first-aid guide when seconds count.",
    bg: "var(--color-cloud)",
    fg: "var(--color-fire-red)",
  },
] as const;

const STEPS = [
  {
    n: "1",
    title: "Add your pet",
    body: "Pop in a name, a photo, and a few details. Hello, new family member!",
  },
  {
    n: "2",
    title: "Track the everyday",
    body: "Meals, meds, weigh-ins, and vet visits — all in one tidy, happy place.",
  },
  {
    n: "3",
    title: "Relax & enjoy",
    body: "We send the reminders. You get more belly rubs and peace of mind.",
  },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-white text-ocean">
      {/* ---------------------------------------------------------------- Nav */}
      <header className="sticky top-0 z-50 border-b border-cloud/60 bg-white/85 backdrop-blur">
        <nav className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="PAWZO home">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose text-white">
              <PawIcon className="h-5 w-5" />
            </span>
            <span className="t-h3 text-ocean" style={{ fontFamily: "var(--font-display)" }}>
              PAWZO
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-deep-blue transition-colors hover:bg-soft-sky sm:inline-flex"
            >
              Log in
            </Link>
            <Link href="/signup" className="btn btn-primary !h-11 !px-6 !text-sm">
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">
        {/* ------------------------------------------------------------- Hero */}
        <section className="relative overflow-hidden">
          {/* soft on-palette background wash */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 60% at 85% 10%, var(--color-soft-sky) 0%, transparent 60%), radial-gradient(50% 50% at 5% 90%, var(--color-blush) 0%, transparent 55%)",
              opacity: 0.5,
            }}
          />
          <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:py-28">
            <div className="anim-fade-up flex flex-col items-center text-center lg:items-start lg:text-left">
              <span className="t-label-s mb-4 inline-flex items-center gap-2 rounded-badge bg-sunshine px-3 py-1.5 text-ocean">
                <PawIcon className="h-3.5 w-3.5 text-rose" />
                Your pet&apos;s happy place
              </span>
              <h1 className="t-display max-w-xl text-balance text-ocean">
                Everything your pet needs, in one warm little app.
              </h1>
              <p className="t-body-l mt-5 max-w-md text-sky">
                Track health, feeding, meds, growth, and memories — and reach an
                emergency vet fast. PAWZO is the warm hug your pet deserves. 🐾
              </p>
              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link href="/signup" className="btn btn-primary btn-lg w-full sm:w-auto">
                  Get started free
                </Link>
                <Link href="/login" className="btn btn-secondary btn-lg w-full sm:w-auto">
                  Log in
                </Link>
              </div>
              <p className="t-body mt-4 text-purple-haze">
                Free to start • No card needed • Cancel anytime
              </p>
            </div>

            {/* Hero illustration — friendly, rounded, on-palette */}
            <div className="anim-fade-up flex justify-center lg:justify-end">
              <HeroArt />
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- Features */}
        <section
          className="px-4 py-16 sm:px-6 sm:py-20"
          aria-labelledby="features-heading"
        >
          <div className="mx-auto w-full max-w-[1200px]">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 id="features-heading" className="t-h1 text-ocean">
                One app for the whole journey
              </h2>
              <p className="t-body-l mt-3 text-sky">
                From first meal to vet visits, PAWZO keeps every little detail
                cared for — so you can focus on the cuddles.
              </p>
            </div>

            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body, bg, fg }) => (
                <li
                  key={title}
                  className="card-hover rounded-card bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-cloud/70"
                >
                  <span
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: bg, color: fg }}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="t-h3 text-ocean">{title}</h3>
                  <p className="t-body mt-2 text-sky">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* -------------------------------------------------------- How it works */}
        <section
          className="px-4 py-16 sm:px-6 sm:py-20"
          aria-labelledby="how-heading"
        >
          <div className="mx-auto w-full max-w-[1200px] rounded-[28px] bg-soft-sky px-6 py-12 sm:px-10 sm:py-16">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 id="how-heading" className="t-h1 text-ocean">
                Get started in three happy steps
              </h2>
              <p className="t-body-l mt-3 text-deep-blue">
                You&apos;ll be up and running before the kettle boils.
              </p>
            </div>
            <ol className="grid gap-6 sm:grid-cols-3">
              {STEPS.map(({ n, title, body }) => (
                <li
                  key={n}
                  className="rounded-card bg-white p-6 text-center shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                >
                  <span
                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose text-lg font-bold text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {n}
                  </span>
                  <h3 className="t-h3 text-ocean">{title}</h3>
                  <p className="t-body mt-2 text-sky">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ----------------------------------------------------------- Final CTA */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto w-full max-w-[1200px] overflow-hidden rounded-[28px] bg-rose px-6 py-14 text-center sm:px-10 sm:py-16">
            <PawIcon className="anim-float mx-auto h-10 w-10 text-white/90" />
            <h2 className="t-h1 mx-auto mt-4 max-w-xl text-white">
              Ready to give your pet a little extra love?
            </h2>
            <p className="t-body-l mx-auto mt-3 max-w-md text-blush">
              Join PAWZO today and keep your best friend happy, healthy, and
              cared for.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="btn btn-lg w-full bg-white text-rose shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 sm:w-auto"
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className="t-body-l font-semibold text-white underline-offset-4 hover:underline"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------- Footer */}
      <footer className="border-t border-cloud/60 bg-white">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose text-white">
              <PawIcon className="h-4 w-4" />
            </span>
            <span
              className="text-base font-bold text-ocean"
              style={{ fontFamily: "var(--font-display)" }}
            >
              PAWZO
            </span>
          </div>
          <p className="t-body text-purple-haze">
            Made with <span className="text-rose">♥</span> for pets and their people.
          </p>
          <nav className="flex items-center gap-5" aria-label="Footer">
            <Link href="/login" className="t-body text-sky hover:text-ocean">
              Log in
            </Link>
            <Link href="/signup" className="t-body text-sky hover:text-ocean">
              Sign up
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/* ---- Hero illustration: a happy pet in a soft card, fully on-palette ---- */
function HeroArt() {
  return (
    <div className="relative w-full max-w-[420px]">
      {/* floating status badges */}
      <div className="anim-float absolute -left-2 top-8 z-10 flex items-center gap-2 rounded-badge bg-white px-3 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-minty text-ocean">
          <HeartPulseIcon className="h-4 w-4" />
        </span>
        <span className="t-body font-semibold text-ocean">Healthy &amp; happy</span>
      </div>
      <div
        className="anim-float absolute -right-1 bottom-10 z-10 flex items-center gap-2 rounded-badge bg-white px-3 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
        style={{ animationDelay: "1.5s" }}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blush text-rose">
          <BowlIcon className="h-4 w-4" />
        </span>
        <span className="t-body font-semibold text-ocean">Fed 2h ago</span>
      </div>

      {/* main card */}
      <div className="rounded-[28px] bg-soft-sky p-6 shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
        <svg
          viewBox="0 0 320 320"
          className="h-auto w-full"
          role="img"
          aria-label="A cheerful illustrated dog smiling"
        >
          {/* sun */}
          <circle cx="250" cy="64" r="34" fill="var(--color-sunshine)" />
          {/* ground */}
          <ellipse cx="160" cy="290" rx="120" ry="20" fill="var(--color-grass)" />

          {/* ears */}
          <ellipse cx="96" cy="120" rx="26" ry="44" fill="var(--color-deep-blue)" transform="rotate(-18 96 120)" />
          <ellipse cx="224" cy="120" rx="26" ry="44" fill="var(--color-deep-blue)" transform="rotate(18 224 120)" />

          {/* head */}
          <circle cx="160" cy="150" r="80" fill="var(--color-sky)" />
          {/* muzzle */}
          <ellipse cx="160" cy="182" rx="46" ry="38" fill="#ffffff" />

          {/* eyes */}
          <circle cx="134" cy="142" r="11" fill="var(--color-ocean)" />
          <circle cx="186" cy="142" r="11" fill="var(--color-ocean)" />
          <circle cx="137" cy="138" r="3.5" fill="#ffffff" />
          <circle cx="189" cy="138" r="3.5" fill="#ffffff" />

          {/* nose + smile */}
          <ellipse cx="160" cy="172" rx="11" ry="8" fill="var(--color-ocean)" />
          <path
            d="M160 180v10c0 9 8 15 17 12M160 190c0 9-8 15-17 12"
            stroke="var(--color-ocean)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* cheeks */}
          <circle cx="112" cy="170" r="9" fill="var(--color-blush)" />
          <circle cx="208" cy="170" r="9" fill="var(--color-blush)" />

          {/* collar tag */}
          <path d="M120 222h80" stroke="var(--color-rose)" strokeWidth="10" strokeLinecap="round" />
          <circle cx="160" cy="232" r="12" fill="var(--color-rose)" />
          <g transform="translate(150 222)" fill="#ffffff">
            <circle cx="2" cy="6" r="1.6" />
            <circle cx="6" cy="2.5" r="1.6" />
            <circle cx="11" cy="2.5" r="1.6" />
            <circle cx="15" cy="6" r="1.6" />
            <path d="M8.5 7c-2.2 0-4 1.7-4 3.7 0 1.4 1.2 2.1 2.5 2.1.6 0 .9-.2 1.5-.2s.9.2 1.5.2c1.3 0 2.5-.7 2.5-2.1 0-2-1.8-3.7-4-3.7Z" />
          </g>
        </svg>
      </div>
    </div>
  );
}
