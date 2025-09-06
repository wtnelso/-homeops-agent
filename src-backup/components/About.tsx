import Layout from './Layout';

const About: React.FC = () => {
  const teamMembers = [
    {
      name: "Sarah Johnson",
      title: "Founder & CEO", 
      avatar: "/api/placeholder/400/400",
      bio: "Former Google PM with 8+ years building family-focused products"
    },
    {
      name: "Michael Chen",
      title: "CTO",
      avatar: "/api/placeholder/400/400", 
      bio: "AI/ML expert with experience at OpenAI and Microsoft"
    },
    {
      name: "Emily Rodriguez",
      title: "Head of Design",
      avatar: "/api/placeholder/400/400",
      bio: "Design leader focused on human-centered family experiences"
    }
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl lg:text-5xl font-bold lg:tracking-tight">About</h1>
        <p className="text-lg mt-4 text-slate-600">We are a small passionate team.</p>
      </div>

      <div className="flex flex-col gap-3 mx-auto max-w-4xl mt-16">
        <h2 className="font-bold text-3xl text-gray-800">
          Empowering families with AI-powered operations.
        </h2>
        <p className="text-lg leading-relaxed text-slate-500">
          We're a dedicated team focused on solving the unique challenges modern families face with email overload and task coordination. 
          Our diverse backgrounds in AI, product design, and family systems bring different perspectives and experiences that make our team special.
        </p>
        <p className="text-lg leading-relaxed text-slate-500 mt-4">
          HomeOps was born from our own struggles managing family logistics through endless email threads. 
          We believe AI can transform the chaos of family coordination into organized, actionable intelligence that reduces mental load for everyone.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-10 mx-auto max-w-4xl mt-12">
        {teamMembers.map((member, index) => (
          <div key={index} className="group">
            <div className="w-full aspect-square">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-full rounded-sm transition group-hover:-translate-y-1 group-hover:shadow-xl bg-white object-cover object-center aspect-square"
                width={400}
                height={400}
              />
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-lg text-gray-800">{member.name}</h2>
              <h3 className="text-sm text-slate-500">{member.title}</h3>
              <p className="text-sm text-slate-400 mt-2">{member.bio}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 bg-gray-50 rounded-lg p-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Our Mission</h3>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            To reduce the mental load on modern families by transforming email chaos into organized, 
            actionable intelligence through privacy-first AI technology.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Focus</h4>
            <p className="text-slate-600">Laser-focused on family operations and reducing mental load</p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Privacy</h4>
            <p className="text-slate-600">Your family data stays secure with enterprise-grade protection</p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Innovation</h4>
            <p className="text-slate-600">Cutting-edge AI technology designed for real families</p>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default About;