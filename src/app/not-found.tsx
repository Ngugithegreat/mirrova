import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { ButtonLink } from "@/components/ui/Button";
import Auroras from "@/components/motion/Auroras";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-5 pt-[72px] text-center">
        <Auroras dim />
        <p className="tnum font-display float-b relative text-7xl font-semibold text-aurora">404</p>
        <h1 className="font-display mt-4 text-3xl font-semibold">This page went off the chart</h1>
        <p className="mt-3 max-w-md text-ink-2">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className="mt-8 flex gap-3">
          <ButtonLink href="/">Back home</ButtonLink>
          <ButtonLink href="/traders" variant="secondary">Browse traders</ButtonLink>
        </div>
      </main>
      <Footer />
    </>
  );
}
