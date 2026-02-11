import { motion } from 'framer-motion';
import { Video, Play, FileText, Mic, Upload, Shield, Clock, CheckCircle } from 'lucide-react';

function Home({ user, isUser, isAdmin, homeMessage, onStartInterview, onLogin, onSignup, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">InterviewAI</span>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {isUser && (
                    <button
                      onClick={onStartInterview}
                      className="px-5 py-2 rounded-lg bg-white/10 border border-white/20 text-sm font-medium hover:bg-white/20 transition-colors"
                    >
                      Start Interview
                    </button>
                  )}
                  {isAdmin && (
                    <a
                      href="#admin"
                      className="px-5 py-2 rounded-lg bg-violet-600/80 border border-violet-500/50 text-sm font-medium hover:bg-violet-500/80 transition-colors"
                    >
                      Admin Panel
                    </a>
                  )}
                  <span className="text-slate-400 text-sm mr-1">{user.email}</span>
                  <button
                    onClick={onLogout}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onLogin}
                    className="px-5 py-2 rounded-lg bg-white/10 border border-white/20 text-sm font-medium hover:bg-white/20 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={onSignup}
                    className="px-5 py-2 rounded-lg bg-indigo-600 border border-indigo-500 text-sm font-medium hover:bg-indigo-500 transition-colors"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {homeMessage && (
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-3">
          <div className="bg-amber-500/20 border border-amber-500/40 rounded-lg px-4 py-2 text-amber-200 text-sm">
            {homeMessage}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <span className="text-sm text-indigo-300">AI-Powered Video Interviews</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold leading-tight mb-6"
            >
              <span className="text-white">Hiring, </span>
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-teal-400 bg-clip-text text-transparent">
                Evolved.
              </span>
              <br />
              <span className="text-slate-400">The Future of</span>
              <br />
              <span className="text-white">Pre-Selection.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-slate-400 mb-10 max-w-xl"
            >
              Streamline your recruitment process with AI-driven video interviews. 
              <span className="text-white"> Capture talent, not just resumes.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <button
                onClick={onStartInterview}
                className="group relative px-8 py-4 rounded-xl font-semibold text-white overflow-hidden"
              >
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_100%] animate-gradient"></div>
                {/* Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                {/* Content */}
                <span className="relative z-10 flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Start Interview
                </span>
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center gap-8 mt-12 pt-8 border-t border-white/10"
            >
              <div>
                <p className="text-3xl font-bold text-white">2,500+</p>
                <p className="text-sm text-slate-400">Companies Trust Us</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">50K+</p>
                <p className="text-sm text-slate-400">Interviews Completed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">98%</p>
                <p className="text-sm text-slate-400">Satisfaction Rate</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 py-24 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/30 text-sm text-violet-300 mb-4"
            >
              Simple Process
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              How it <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Works</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-lg text-slate-400 max-w-2xl mx-auto"
            >
              Complete your video interview in three simple steps
            </motion.p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: FileText,
                title: 'Read Question',
                description: 'Each question appears on screen with a 10-second preparation countdown before recording begins.',
                color: 'from-blue-500 to-indigo-600'
              },
              {
                step: '02',
                icon: Mic,
                title: 'Record Video',
                description: 'Capture your response using your webcam. Speak naturally within the 2-minute window.',
                color: 'from-violet-500 to-purple-600'
              },
              {
                step: '03',
                icon: Upload,
                title: 'Submit Answer',
                description: 'Your video is automatically uploaded and securely stored for review by recruiters.',
                color: 'from-teal-500 to-emerald-600'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="relative p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all group"
              >
                {/* Step Number Background */}
                <span className="absolute -top-4 -left-2 text-8xl font-bold text-white/5">{item.step}</span>
                
                {/* Icon */}
                <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-3 text-white">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-2 rounded-full bg-teal-500/20 border border-teal-500/30 text-sm text-teal-300 mb-4"
            >
              Features
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Built for <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">Excellence</span>
            </motion.h2>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'Secure Storage',
                description: 'Enterprise-grade encryption for all your video submissions.',
                gradient: 'from-emerald-500 to-teal-600'
              },
              {
                icon: Video,
                title: 'HD Recording',
                description: 'Crystal clear 720p video capture with noise reduction.',
                gradient: 'from-indigo-500 to-violet-600'
              },
              {
                icon: Clock,
                title: '2-Min Responses',
                description: 'All questions have a standardized 2-minute response time.',
                gradient: 'from-orange-500 to-rose-600'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interview Info Section */}
      <section className="relative z-10 py-24 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4 text-white">What to Expect</h2>
              <p className="text-slate-400">Your interview consists of 10 questions. Here's what you need to know:</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {[
                { icon: FileText, text: '10 Interview Questions' },
                { icon: Clock, text: '2 Minutes per Question' },
                { icon: Mic, text: '10-Second Prep Time' },
                { icon: CheckCircle, text: 'Retake Before Submit' }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="text-white font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={onStartInterview}
                className="px-10 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25"
              >
                <span className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Begin Your Interview
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">InterviewAI</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 InterviewAI. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
