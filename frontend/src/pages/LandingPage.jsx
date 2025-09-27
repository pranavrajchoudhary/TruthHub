import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Shield, Users, CheckCircle, Search, TrendingUp, Globe, ArrowRight, Zap } from 'lucide-react'
import BackendWakeupServiceSingleton from '../utils/backendWakeup'
import BackendWakeupLoader from '../components/BackendWakeupLoader'
import SmoothCursor from '../components/SmoothCursor'

const LandingPage = () => {
  const navigate = useNavigate()
  const [backendStatus, setBackendStatus] = useState('checking')
  const [showWakeupLoader, setShowWakeupLoader] = useState(false)

  useEffect(() => {
    // Check backend status on landing page entry
    const wakeupService = BackendWakeupServiceSingleton.getInstance()
    
    // Check current status
    const currentStatus = wakeupService.getStatus()
    setBackendStatus(currentStatus)
    
    // Start gentle background wake-up (no UI loader)
    if (currentStatus !== 'ready') {
      wakeupService.wakeupBackend({
        onStatusChange: (status) => {
          setBackendStatus(status)
          // Don't show loader for background wake-up, only update status
        }
      })
    }
  }, [])

  const handleGetStarted = () => {
    if (backendStatus === 'ready') {
      navigate('/auth')
    } else {
      // Show wake-up loader if backend is not ready
      setShowWakeupLoader(true)
      
      // Make sure wake-up process is running
      const wakeupService = BackendWakeupServiceSingleton.getInstance()
      wakeupService.wakeupBackend({
        onStatusChange: (status) => {
          setBackendStatus(status)
          if (status === 'ready') {
            setShowWakeupLoader(false)
            navigate('/auth')
          }
        }
      })
    }
  }

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Peer-to-Peer Fact Checking",
      description: "Community-driven verification system where users collaboratively validate news authenticity",
      highlight: "Revolutionary"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community Moderation",
      description: "Democratic content moderation with transparent processes and reputation-based voting",
      highlight: "Transparent"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Source Credibility Scoring",
      description: "Advanced algorithms track source reliability and journalist reputation over time",
      highlight: "Smart Analytics"
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: "Advanced Filtering",
      description: "Filter news by credibility score, category, verification status, and source reliability",
      highlight: "Precision"
    }
  ]

  const stats = [
    { number: "10K+", label: "Active Fact-Checkers" },
    { number: "50K+", label: "Articles Verified" },
    { number: "95%", label: "Accuracy Rate" },
    { number: "200+", label: "Trusted Sources" }
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#eceae1' }}>
      <SmoothCursor />
      
      {/* Backend Wake-up Loader */}
      {showWakeupLoader && (
        <BackendWakeupLoader
          onClose={() => setShowWakeupLoader(false)}
          onSuccess={() => {
            setShowWakeupLoader(false)
            navigate('/auth')
          }}
        />
      )}
      {/* Navigation */}
      <nav className="relative z-20 px-6 py-4 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-dark-green rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-dark-green">TruthHub</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-dark-green transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-700 hover:text-dark-green transition-colors">How It Works</a>
            <a href="#community" className="text-gray-700 hover:text-dark-green transition-colors">Community</a>
          </div>
          
          <button
            onClick={handleGetStarted}
            className="bg-dark-green text-white px-6 py-3 rounded-lg hover-lift smooth-transition font-medium button-press glow-effect"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                <span className="green-highlight animate-scale-in">Truth</span> Through{" "}
                <span className="green-highlight animate-scale-in" style={{ animationDelay: '0.3s' }}>Community</span>
              </h1>
            </div>
            
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
              <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
                The first decentralized news platform where{" "}
                <span className="green-highlight font-semibold">peer verification</span> meets{" "}
                <span className="green-highlight font-semibold">transparent moderation</span> to deliver{" "}
                <span className="green-highlight font-semibold">reliable news</span>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-fade-in-up opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
              <button
                onClick={handleGetStarted}
                className="bg-dark-green text-white px-8 py-4 rounded-xl hover-lift smooth-transition font-semibold text-lg flex items-center group button-press glow-effect"
              >
                Start Fact-Checking
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 smooth-transition" />
              </button>
              
              <button className="border-2 border-dark-green text-dark-green px-8 py-4 rounded-xl hover:bg-dark-green hover:text-white smooth-transition font-semibold text-lg button-press">
                Watch Demo
              </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="text-center animate-fade-in-up opacity-0 hover-lift smooth-transition"
                  style={{ 
                    animationDelay: `${0.8 + index * 0.1}s`, 
                    animationFillMode: 'forwards' 
                  }}
                >
                  <div className="text-3xl md:text-4xl font-bold text-dark-green mb-2 pulse-glow">{stat.number}</div>
                  <div className="text-gray-600 text-sm md:text-base">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent opacity-20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-dark-green opacity-10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why <span className="green-highlight">TruthHub</span> is Different
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Traditional news platforms rely on centralized fact-checking. We empower the community to verify truth collectively.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-primary p-8 rounded-2xl card-shadow hover-lift smooth-transition group animate-fade-in-up opacity-0"
                style={{ 
                  animationDelay: `${1.2 + index * 0.2}s`, 
                  animationFillMode: 'forwards' 
                }}
              >
                <div className="bg-dark-green text-white w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 smooth-transition glow-effect">
                  {feature.icon}
                </div>
                
                <div className="green-highlight text-sm font-medium mb-3 inline-block animate-scale-in">
                  {feature.highlight}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How <span className="green-highlight">Peer Verification</span> Works
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center animate-fade-in-left opacity-0" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 hover-lift smooth-transition glow-effect">
                <span className="text-2xl font-bold text-dark-green">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Submit & Discover</h3>
              <p className="text-gray-600">Community members submit news articles and discover content from verified sources</p>
            </div>
            
            <div className="text-center animate-fade-in-up opacity-0" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 hover-lift smooth-transition glow-effect">
                <span className="text-2xl font-bold text-dark-green">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Collaborative Verification</h3>
              <p className="text-gray-600">Multiple fact-checkers review evidence, sources, and provide verification votes</p>
            </div>
            
            <div className="text-center animate-fade-in-right opacity-0" style={{ animationDelay: '0.9s', animationFillMode: 'forwards' }}>
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 hover-lift smooth-transition glow-effect">
                <span className="text-2xl font-bold text-dark-green">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Trust Score & Ranking</h3>
              <p className="text-gray-600">Articles receive credibility scores based on community consensus and source reliability</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="px-6 py-20 bg-gradient-bg">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Join the <span className="green-highlight">Truth Community</span>
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Be part of the movement to make news more reliable, transparent, and trustworthy for everyone.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            <button
              onClick={handleGetStarted}
              className="bg-dark-green text-white px-8 py-4 rounded-xl hover-lift smooth-transition font-semibold text-lg flex items-center group button-press pulse-glow"
            >
              Start Fact-Checking Now
              <CheckCircle className="w-5 h-5 ml-2 group-hover:scale-110 group-hover:rotate-12 smooth-transition" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-green text-white px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-dark-green" />
                </div>
                <span className="text-xl font-bold">TruthHub</span>
              </div>
              <p className="text-gray-300">Empowering communities to fight misinformation through collaborative fact-checking.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <div className="space-y-2 text-gray-300">
                <div>How It Works</div>
                <div>Community Guidelines</div>
                <div>Verification Process</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <div className="space-y-2 text-gray-300">
                <div>Fact-Checkers</div>
                <div>Journalists</div>
                <div>Researchers</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-gray-300">
                <div>Help Center</div>
                <div>Contact Us</div>
                <div>Privacy Policy</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-600 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2025 TruthHub. Building trust through community verification.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage