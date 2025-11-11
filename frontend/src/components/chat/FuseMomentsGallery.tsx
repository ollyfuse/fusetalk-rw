import React, { useState, useEffect } from 'react';
import { chatAPI } from '../../services/api';

interface FuseMoment {
  id: string;
  user_a: { nickname: string };
  user_b: { nickname: string };
  summary_text: string;
  contact_exchanged: boolean;
  created_at: string;
  session: {
    id: string;
    topic_tag?: string;
  };
}

const FuseMomentsGallery: React.FC = () => {
  const [fuseMoments, setFuseMoments] = useState<FuseMoment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFuseMoments();
  }, []);

  const loadFuseMoments = async () => {
    try {
      const data = await chatAPI.getFuseMoments();
      setFuseMoments(data.results || []);
    } catch (error) {
      console.error('❌ Error loading Fuse Moments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">✨</div>
          <p>Loading your Fuse Moments...</p>
        </div>
      </div>
    );
  }

return (
  <div className="min-h-screen bg-gray-50">
    {/* Navigation Header */}
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Your Fuse Moments ✨</h1>
          <p className="text-gray-600">Special connections you've made</p>
        </div>
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          ← Back to Chat
        </button>
      </div>
    </div>

    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {fuseMoments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💫</div>
            <h2 className="text-xl font-semibold mb-2">No Fuse Moments Yet</h2>
            <p className="text-gray-600 mb-6">Start chatting and liking conversations to create your first Fuse Moment!</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
            >
              Start Chatting
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {fuseMoments.map((moment) => (
              <div key={moment.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {moment.user_a.nickname[0]?.toUpperCase()}
                    </div>
                    <span className="text-2xl">💕</span>
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {moment.user_b.nickname[0]?.toUpperCase()}
                    </div>
                  </div>
                  {moment.contact_exchanged && (
                    <span className="text-green-500 text-sm">📱 Connected</span>
                  )}
                </div>
                
                <p className="text-gray-700 mb-3">{moment.summary_text}</p>
                
                {moment.session.topic_tag && (
                  <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm mb-3">
                    #{moment.session.topic_tag}
                  </span>
                )}
                
                <div className="text-xs text-gray-500 mb-4">
                  {new Date(moment.created_at).toLocaleDateString()} at {new Date(moment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                
                <button
                  onClick={() => {/* TODO: Reconnect functionality */}}
                  className="w-full px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 text-sm"
                >
                  💬 Reconnect
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default FuseMomentsGallery;
