import { Link } from "react-router-dom";
import blitixLogo from "@/assets/blitix-logo.png";

const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <img src={blitixLogo} alt="Blitix" className="h-8 w-auto" />
            <p className="text-sm text-muted-foreground">
              Think Faster. Learn Smarter.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link 
              to="/about" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link 
              to="/privacy" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link 
              to="/terms" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Blitix — Founded by Rishabh Raj Pandey. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
