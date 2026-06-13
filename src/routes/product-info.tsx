import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FileText, Eye, Download, Shield, Award } from "lucide-react";

export const Route = createFileRoute("/product-info")({
  component: ProductInfoPage,
  head: () => ({
    meta: [
      { title: "Our Certifications — Shatakshi Herbal" },
      { name: "description", content: "Official certifications and registrations of Shatakshi Herbal." },
    ],
  }),
});

const certificates = [
  {
    icon: Award,
    title: "Udyam Registration Certificate (MSME)",
    description: "Reg. No. UDYAM-MP-32-0017415",
    issuer: "Ministry of MSME, Govt. of India",
    file: "/documents/Suneel_Katiya_Udyam.pdf",
    badge: "MSME Certified",
  },
  {
    icon: Shield,
    title: "GST Registration Certificate",
    description: "GSTIN: 23CNYPK2804B1Z6",
    issuer: "Goods & Services Tax, Govt. of India",
    file: "/documents/gst_shatakshiherbal.pdf",
    badge: "GST Verified",
  },
];

function ProductInfoPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase border border-primary/30 rounded-full px-4 py-1.5 mb-4">
              <Shield className="w-3.5 h-3.5" /> Verified & Authentic
            </span>
            <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-4">Our Certifications</h1>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
              Shatakshi Herbal is a fully registered and government-certified business. Our certifications reflect our commitment to transparency and trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert.title}
                className="group bg-white border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <div className="bg-dark-hero p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <cert.icon className="w-7 h-7 text-cream" />
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-bold tracking-widest text-primary-light uppercase mb-1">{cert.badge}</span>
                    <h2 className="text-cream font-display text-lg leading-snug">{cert.title}</h2>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start gap-3 mb-6">
                    <FileText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-foreground">{cert.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{cert.issuer}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <a
                      href={cert.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition"
                    >
                      <Eye className="w-4 h-4" /> View
                    </a>
                    <a
                      href={cert.file}
                      download
                      className="flex-1 inline-flex items-center justify-center gap-2 border border-primary text-primary rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-primary/5 transition"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
