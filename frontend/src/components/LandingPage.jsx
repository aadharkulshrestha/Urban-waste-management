import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, Users, BarChart3, Smartphone, Recycle, Shield, Zap } from 'lucide-react';
import { useAuth } from '../App';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const features = [
    {
      icon: <MapPin className="h-8 w-8 text-emerald-600" />,
      title: 'Real-Time Tracking',
      description: 'Track waste collection vehicles in real-time with GPS technology and get accurate pickup times.'
    },
    {
      icon: <Smartphone className="h-8 w-8 text-emerald-600" />,
      title: 'Smart Reporting',
      description: 'Citizens can easily report waste issues with photos and location data for faster resolution.'
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-emerald-600" />,
      title: 'Analytics Dashboard',
      description: 'Municipal authorities get comprehensive insights and data-driven decision making tools.'
    },
    {
      icon: <Users className="h-8 w-8 text-emerald-600" />,
      title: 'Worker Management',
      description: 'Efficient worker attendance, route optimization, and safety management systems.'
    },
    {
      icon: <Recycle className="h-8 w-8 text-emerald-600" />,
      title: 'Reward System',
      description: 'Gamified eco-friendly actions with points and rewards for community engagement.'
    },
    {
      icon: <Shield className="h-8 w-8 text-emerald-600" />,
      title: 'Safety First',
      description: 'Comprehensive safety protocols and emergency response systems for worker protection.'
    }
  ];

  const userTypes = [
    {
      title: 'Citizens',
      description: 'Report issues, track pickups, earn rewards',
      color: 'bg-emerald-100 text-emerald-700',
      features: ['Report illegal dumping', 'Track garbage trucks', 'Earn reward points', 'Schedule pickups']
    },
    {
      title: 'Workers',
      description: 'Manage routes, track attendance, ensure safety',
      color: 'bg-teal-100 text-teal-700',
      features: ['GPS route navigation', 'Digital attendance', 'Safety checklists', 'Report issues']
    },
    {
      title: 'Administrators',
      description: 'Monitor citywide operations and analytics',
      color: 'bg-blue-100 text-blue-700',
      features: ['City-wide monitoring', 'Worker management', 'Analytics reports', 'Resource planning']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50">
      {/* Navigation */}
      <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-emerald-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                <Recycle className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                CleanCity Connect
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="capitalize">
                    {user.role}
                  </Badge>
                  <span className="text-slate-700">Welcome, {user.name}</span>
                  <Button onClick={() => navigate('/dashboard')} className="bg-emerald-600 hover:bg-emerald-700">
                    Dashboard
                  </Button>
                </div>
              ) : (
                <Button onClick={() => navigate('/auth')} variant="outline">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  <Zap className="h-4 w-4 mr-1" />
                  Smart City Solution
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                  Smart Urban 
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Waste Management
                  </span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Connect citizens, workers, and municipal authorities through one digital platform. 
                  Real-time tracking, smart reporting, and data-driven waste collection for cleaner cities.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  data-testid="get-started-btn"
                >
                  Get Started
                  <MapPin className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  Learn More
                  <BarChart3 className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                <img 
                  src="dashboardimg.png" 
                  alt="Smart City Technology"
                  className="rounded-3xl shadow-2xl w-full h-96 object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-3xl blur-3xl opacity-30"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl blur-3xl opacity-30"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Comprehensive Waste Management Solution
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Revolutionize your city's waste management with cutting-edge technology and seamless coordination.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 bg-emerald-50 rounded-2xl w-fit group-hover:bg-emerald-100 transition-colors">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-center leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Built for Everyone
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Three distinct interfaces designed for citizens, workers, and administrators.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {userTypes.map((type, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-2xl">{type.title}</CardTitle>
                    <Badge className={type.color}>{type.title}</Badge>
                  </div>
                  <p className="text-slate-600">{type.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {type.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center text-slate-700">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Images Showcase */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              See CleanCity Connect in Action
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <img 
                src="https://images.unsplash.com/photo-1574974671999-24b7dfbb0d53?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHx3YXN0ZSUyMG1hbmFnZW1lbnR8ZW58MHx8fHwxNzU5ODUxMzQ3fDA&ixlib=rb-4.1.0&q=85" 
                alt="Waste Management Workers"
                className="rounded-2xl shadow-lg w-full h-64 object-cover"
              />
              <h3 className="text-xl font-semibold text-slate-900">Worker Management</h3>
              <p className="text-slate-600">Efficient route planning and worker safety protocols</p>
            </div>
            <div className="space-y-4">
              <img 
                src="https://images.unsplash.com/photo-1551650975-87deedd944c3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxtb2JpbGUlMjBhcHB8ZW58MHx8fHwxNzU5ODUxMzUxfDA&ixlib=rb-4.1.0&q=85" 
                alt="Mobile App Interface"
                className="rounded-2xl shadow-lg w-full h-64 object-cover"
              />
              <h3 className="text-xl font-semibold text-slate-900">Smart Mobile App</h3>
              <p className="text-slate-600">Intuitive interface for all users with real-time updates</p>
            </div>
            <div className="space-y-4">
              <img 
                src="https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHx3YXN0ZSUyMG1hbmFnZW1lbnR8ZW58MHx8fHwxNzU9ODUxMzQ3fDA&ixlib=rb-4.1.0&q=85" 
                alt="Waste Management System"
                className="rounded-2xl shadow-lg w-full h-64 object-cover"
              />
              <h3 className="text-xl font-semibold text-slate-900">Smart Bins</h3>
              <p className="text-slate-600">IoT-enabled bins with real-time fill level monitoring</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-4xl font-bold text-white">
              Ready to Transform Your City's Waste Management?
            </h2>
            <p className="text-xl text-emerald-100">
              Join the smart city revolution. Start optimizing waste collection, 
              engaging citizens, and making data-driven decisions today.
            </p>
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Your Journey
              <Truck className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
                  <Recycle className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">CleanCity Connect</span>
              </div>
              <p className="text-slate-400">
                Revolutionizing urban waste management through smart technology and community engagement.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Features</h3>
              <ul className="space-y-2 text-slate-400">
                <li>Real-time Tracking</li>
                <li>Smart Reporting</li>
                <li>Analytics Dashboard</li>
                <li>Worker Management</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
              <p className="text-slate-400">
                Transform your city's waste management system today.
              </p>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500">
            <p>&copy; 2024 CleanCity Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
