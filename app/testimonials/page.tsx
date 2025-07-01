

import Image from "next/image";
import Link from "next/link";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Mother of 2",
    location: "San Francisco, CA",
    image: "https://i.pinimg.com/originals/d7/48/f4/d748f4565dfe2e40024e56abce4a2321.jpg",
    rating: 5,
    quote: "SafePlay has completely transformed how I feel about letting my kids play at venues. The instant notifications give me peace of mind, and the memory capture feature is absolutely amazing. I love seeing all the candid moments of my children having fun!",
    highlight: "Complete peace of mind"
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Father of 3",
    location: "Austin, TX",
    image: "https://i.pinimg.com/originals/bc/ad/46/bcad46c1a82b9f8e7a0725de3b681dc2.jpg",
    rating: 5,
    quote: "As a busy parent, SafePlay allows me to actually relax when my kids are playing. I get real-time updates on my phone, and the photos captured are precious memories I would have missed otherwise. The technology is incredible!",
    highlight: "Real-time peace of mind"
  },
  {
    id: 3,
    name: "Jennifer Martinez",
    role: "Play Center Owner",
    location: "Denver, CO",
    image: "https://i.pinimg.com/originals/f9/f4/a9/f9f4a9ab04a9e13aaac330a0e4d2c438.jpg",
    rating: 5,
    quote: "SafePlay has revolutionized our business. Parents love the safety features and memory capture, which has increased our customer retention by 40%. The installation was seamless, and the support team is fantastic.",
    highlight: "40% increase in retention"
  },
  {
    id: 4,
    name: "David Kim",
    role: "Adventure Park Manager",
    location: "Orlando, FL",
    image: "https://i.pinimg.com/originals/21/76/78/217678f7eb0ebcae251430dda3529ff0.jpg",
    rating: 5,
    quote: "We've been using SafePlay for 6 months and it's been a game-changer. The system helps us track capacity, ensure child safety, and provide an enhanced experience for families. Our customer satisfaction scores have never been higher.",
    highlight: "Enhanced family experience"
  },
  {
    id: 5,
    name: "Lisa Thompson",
    role: "Grandmother",
    location: "Seattle, WA",
    image: "https://i.pinimg.com/originals/d6/f9/91/d6f991fa9de5196eeaaa492470a6c8b2.png",
    rating: 5,
    quote: "When I take my grandchildren to play venues with SafePlay, I feel so much more confident. The technology might seem complex, but it's incredibly easy to use. Getting photos of their playtime is an unexpected bonus!",
    highlight: "Confidence with grandchildren"
  },
  {
    id: 6,
    name: "Robert Williams",
    role: "Recreation Center Director",
    location: "Chicago, IL",
    image: "https://i.pinimg.com/736x/d6/f9/91/d6f991fa9de5196eeaaa492470a6c8b2.jpg",
    rating: 5,
    quote: "SafePlay has transformed our community center. We can now handle larger groups safely while providing parents with the assurance they need. The analytics help us understand usage patterns and improve our programs.",
    highlight: "Improved community programs"
  },
  {
    id: 7,
    name: "Amanda Rodriguez",
    role: "Single Mother",
    location: "Phoenix, AZ",
    image: "https://i.pinimg.com/originals/36/ab/cd/36abcd0c08cb82d6873d118eee7e94b2.jpg",
    rating: 5,
    quote: "Being a single mom means I'm always worried about my daughter's safety. SafePlay gives me the confidence to let her play freely while I know exactly where she is. The automatic photos are like having a personal photographer!",
    highlight: "Freedom to let kids play"
  },
  {
    id: 8,
    name: "James Cooper",
    role: "Trampoline Park Owner",
    location: "Las Vegas, NV",
    image: "https://i.pinimg.com/originals/4c/26/67/4c26671d27cfef60f62e60ab3960417c.jpg",
    rating: 5,
    quote: "Our liability insurance costs decreased significantly after implementing SafePlay. The system provides detailed safety records and has helped prevent several incidents. Parents love it, and so do we!",
    highlight: "Reduced liability costs"
  },
  {
    id: 9,
    name: "Emily Davis",
    role: "Mother of twins",
    location: "Miami, FL",
    image: "https://i.pinimg.com/736x/89/6e/88/896e88547ee22df2db5ba53c52e18c6a.jpg",
    rating: 5,
    quote: "Managing twins at play venues used to be stressful, but SafePlay changed everything. I get separate notifications for each child and beautiful photos of their individual adventures. It's like having superpowers as a parent!",
    highlight: "Managing multiple children"
  }
];

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-peace-of-mind bg-overlay-light">
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
                <span className="text-blue-600 font-medium">Testimonials</span>
                <Link href="/faq" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">FAQ</Link>
                <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Contact</Link>
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
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              What Families Are Saying
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover how SafePlay is transforming child safety and creating peace of mind 
              for thousands of families and venue operators worldwide.
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16 max-w-4xl mx-auto">
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">10,000+</div>
              <div className="text-gray-600">Children Protected Daily</div>
            </div>
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Venues Worldwide</div>
            </div>
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600">Safety Accuracy</div>
            </div>
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">4.9/5</div>
              <div className="text-gray-600">Customer Rating</div>
            </div>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {testimonials.map((testimonial) => (
              <div 
                key={testimonial.id} 
                className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
                    <Image 
                      src={testimonial.image}
                      alt={`${testimonial.name} - ${testimonial.role}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-xs text-gray-500">{testimonial.location}</p>
                  </div>
                </div>

                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                <div className="relative">
                  <Quote className="h-8 w-8 text-blue-600 opacity-50 mb-2" />
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {testimonial.quote}
                  </p>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800">
                      ✨ {testimonial.highlight}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center mt-20">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Join Thousands of Happy Families
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Experience the peace of mind that comes with knowing your children are safe 
                and creating beautiful memories every time they play.
              </p>
              <div className="space-x-4">
                <Link href="/auth/signup" className="btn-primary text-xl px-12 py-4 shadow-lg">
                  Start Free Trial
                </Link>
                <Link href="/contact" className="btn-outline text-xl px-12 py-4">
                  Contact Sales
                </Link>
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  ✓ No setup fees  ✓ 30-day money-back guarantee  ✓ 24/7 support
                </p>
              </div>
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

