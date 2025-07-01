

import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import ContactForm from "./contact-form";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-auth bg-overlay-dark">
      <div className="content-overlay">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center">
                <Image 
                  src="/logos/safeplay_combined_logo.png" 
                  alt="SafePlay - Biometric Child Safety Platform" 
                  width={120} 
                  height={40}
                  className="h-10 w-auto"
                />
              </Link>
              <nav className="hidden md:flex items-center space-x-8">
                <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Home</Link>
                <Link href="/#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Features</Link>
                <Link href="/testimonials" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Testimonials</Link>
                <Link href="/faq" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">FAQ</Link>
                <span className="text-blue-600 font-medium">Contact</span>
              </nav>
              <div className="flex items-center space-x-3">
                <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200">
                  Login
                </Link>
                <Link href="/auth/signup" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Have questions about SafePlay? We're here to help you keep your children safe 
              and create lasting memories. Reach out to our team today.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-8">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-600 p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Email</h3>
                    <p className="text-white/80">support@safeplay.com</p>
                    <p className="text-white/80">sales@safeplay.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-blue-600 p-3 rounded-lg">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Phone</h3>
                    <p className="text-white/80">+1 (555) 123-SAFE</p>
                    <p className="text-white/80">+1 (555) 123-7233</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-blue-600 p-3 rounded-lg">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Office</h3>
                    <p className="text-white/80">
                      123 Technology Drive<br />
                      Silicon Valley, CA 94025<br />
                      United States
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">Business Hours</h3>
                <div className="space-y-2 text-white/80">
                  <p>Monday - Friday: 9:00 AM - 6:00 PM PST</p>
                  <p>Saturday: 10:00 AM - 4:00 PM PST</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Send us a Message</h2>
              <ContactForm />
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-20">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20">
              <h2 className="text-4xl font-bold text-white mb-6">
                Ready to protect your children?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Don't wait - start your SafePlay journey today and give your family the peace of mind they deserve.
              </p>
              <Link href="/auth/signup" className="btn-primary text-xl px-12 py-4 shadow-2xl">
                Get Started Now
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900/95 backdrop-blur-sm text-white py-16 mt-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                {/* Brand Column */}
                <div className="md:col-span-1">
                  <div className="mb-4">
                    <Image 
                      src="/logos/safeplay_combined_logo.png" 
                      alt="SafePlay" 
                      width={120} 
                      height={40}
                      className="h-10 w-auto filter brightness-0 invert"
                    />
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Keeping families connected and children safe with cutting-edge biometric technology.
                  </p>
                </div>
                
                {/* Navigate Column */}
                <div>
                  <h3 className="font-semibold text-white mb-4">Navigate</h3>
                  <ul className="space-y-3 text-sm">
                    <li><Link href="/" className="text-gray-300 hover:text-white transition-colors">Home</Link></li>
                    <li><a href="/#features" className="text-gray-300 hover:text-white transition-colors">Features</a></li>
                    <li><Link href="/testimonials" className="text-gray-300 hover:text-white transition-colors">Testimonials</Link></li>
                  </ul>
                </div>
                
                {/* Support Column */}
                <div>
                  <h3 className="font-semibold text-white mb-4">Support</h3>
                  <ul className="space-y-3 text-sm">
                    <li><Link href="/faq" className="text-gray-300 hover:text-white transition-colors">FAQ</Link></li>
                    <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
                  </ul>
                </div>
                
                {/* Connect Column */}
                <div>
                  <h3 className="font-semibold text-white mb-4">Connect</h3>
                  <div className="flex space-x-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">f</span>
                    </div>
                    <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">t</span>
                    </div>
                    <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">i</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom Bar */}
              <div className="border-t border-gray-700 pt-8 text-center">
                <p className="text-gray-400 text-sm">
                  © 2025 SafePlay. All Rights Reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

