import React from 'react';
import { Link } from 'react-router-dom';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  imageUrl?: string;
}

const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'Morchalin Ahmed Amio',
    role: 'Data Analyst, Developer',
    bio: 'CSE (first year), Rajshahi University of Engineering & Technology',
    imageUrl: '/team/jane-smith.jpg'
  },
  {
    id: 2,
    name: 'Bitto Saha',
    role: 'Project Lead, Developer',
    bio: 'CSE (first year), Rajshahi University of Engineering & Technology',
    imageUrl: '/team/bitto-saha.jpg'
  },
  
  {
    id: 3,
    name: 'Fazle Rabbi',
    role: 'Data Analyst, Developer',
    bio: 'CSE (first year), Rajshahi University of Engineering & Technology',
    imageUrl: '/team/maria-garcia.jpg'
  },
  {
    id: 4,
    name: 'Shuvo',
    role: 'Resource management',
    bio: 'CSE (first year), Rajshahi University of Engineering & Technology',
    imageUrl: '/team/alex-johnson.jpg'
  },
  
 {
    id: 5,
    name: 'Jannatul Mawa Tanha',
    role: 'Communication',
    bio: 'CSE (first year), Rajshahi University of Engineering & Technology',
    imageUrl: '/team/jane-smith.jpg'
  },
];

const TeamMembers: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-10 text-center">Our Team</h1>
        <p className="text-xl text-center mb-12">
          Meet the dreamers behind the project
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member) => (
            <div 
              key={member.id} 
              className="bg-gray-900 rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:transform hover:scale-105"
            >
              <div className="h-64 bg-gray-800 flex items-center justify-center">
                {member.imageUrl ? (
                  <img 
                    src={member.imageUrl} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-3xl font-bold">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                <p className="text-blue-400 mb-4">{member.role}</p>
                <p className="text-gray-300">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 flex gap-4 justify-center text-center">
          <Link to="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition duration-300">
            Back to Simulation
          </Link>
          <Link to="/about" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition duration-300">
            Back to About
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeamMembers;
