import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, User } from '../services/authService';

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      const token = authService.getToken();
      
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const userData = await authService.getUserProfile(token);
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user data:', error);
        authService.removeToken();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  const handleLogout = () => {
    authService.removeToken();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-white/80">Hoş geldin, {user?.username}!</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Hoş Geldin!</h3>
                <p className="text-white/70 text-sm">Başarıyla giriş yaptınız</p>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4">Profil Bilgileri</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/70">Kullanıcı Adı:</span>
                <span className="text-white">{user?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Email:</span>
                <span className="text-white">{user?.email || 'Belirtilmemiş'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">ID:</span>
                <span className="text-white">{user?.id}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4">Hızlı İşlemler</h3>
            <div className="space-y-3">
              <button className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200">
                Profili Düzenle
              </button>
              <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                Ayarlar
              </button>
              <button className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
                Yardım
              </button>
            </div>
          </div>
        </div>

        {/* Additional Content */}
        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">NAAAAAAAAAAABER</h2>
            <p className="text-white/80 text-lg mb-6">
              Başarıyla giriş yaptınız! Bu dashboard sayfasında çeşitli işlemler yapabilirsiniz.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Son Aktiviteler</h4>
                <p className="text-white/70 text-sm">Henüz aktivite bulunmuyor.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Bildirimler</h4>
                <p className="text-white/70 text-sm">Yeni bildirim yok.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
