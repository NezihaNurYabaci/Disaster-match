import { useFocusEffect, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMatches } from '../../api';
import { auth, db } from '../../firebaseConfig';

type Match = {
  resourceId: string;
  category: string;
  description: string;
  distance_km: number;
  semantic_score: number;
  location_score: number;
  hybrid_score: number;
};

type Need = {
  id: string;
  category: string;
  description: string;
  status: string;
};

export default function MatchListScreen() {
  const router = useRouter();
  const [needs, setNeeds] = useState<Need[]>([]);
  const [selectedNeedId, setSelectedNeedId] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadUserNeeds();
    }, [])
  );

  const loadUserNeeds = async () => {
    if (!auth.currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (!userDoc.exists()) return;
      const data = userDoc.data();
      const needIds: string[] = data.needIds || [];
      if (needIds.length === 0) {
        setNeeds([]);
        return;
      }
      // Her bir ihtiyacın detayını çek
      const needList: Need[] = [];
      for (const id of needIds) {
        const needDoc = await getDoc(doc(db, 'needs', id));
        if (needDoc.exists()) {
          const nd = needDoc.data();
          needList.push({
            id,
            category: nd.category || '',
            description: nd.description || '',
            status: nd.status || 'active',
          });
        }
      }
      setNeeds(needList);
    } catch (error) {
      console.log('Kullanıcı ihtiyaçları yüklenemedi');
    }
  };

  const handleSearch = async (needId: string) => {
    setSelectedNeedId(needId);
    setLoading(true);
    setIsClosed(false);
    setMatches([]);
    try {
      const response = await getMatches(needId);
      setMatches(response.data.matches);
    } catch (error) {
      Alert.alert('Hata', 'Eşleşmeler alınamadı. Backend çalışıyor mu?');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    Alert.alert(
      'İhtiyacı Kapat',
      'Yardım ulaştı mı? Kapatmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, Kapat',
          style: 'destructive',
          onPress: async () => {
            setClosing(true);
            try {
              await updateDoc(doc(db, 'needs', selectedNeedId), { status: 'closed' });
              setIsClosed(true);
              setMatches([]);
              await loadUserNeeds();
              Alert.alert('Kapatıldı ✅', 'Yardım ulaştığı için teşekkürler!');
            } catch (error) {
              Alert.alert('Hata', 'İhtiyaç kapatılamadı.');
            } finally {
              setClosing(false);
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Hata', 'Çıkış yapılamadı.');
            }
          }
        }
      ]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.6) return '#2a9d8f';
    if (score >= 0.3) return '#e9c46a';
    return '#e63946';
  };

  const activeNeeds = needs.filter(n => n.status !== 'closed');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Eşleşmeleri Bul</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Çıkış</Text>
          </TouchableOpacity>
        </View>

        {activeNeeds.length > 0 ? (
          <>
            <Text style={styles.label}>İhtiyaçlarım</Text>
            {activeNeeds.map((need) => (
              <TouchableOpacity
                key={need.id}
                style={[styles.needBtn, selectedNeedId === need.id && styles.needBtnActive]}
                onPress={() => handleSearch(need.id)}
              >
                <View style={styles.needBtnTop}>
                  <View style={[styles.needCategoryTag, selectedNeedId === need.id && styles.needCategoryTagActive]}>
                    <Text style={[styles.needCategoryText, selectedNeedId === need.id && styles.needCategoryTextActive]}>
                      {need.category}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.needDesc, selectedNeedId === need.id && styles.needTextActive]}
                  numberOfLines={2}
                >
                  {need.description}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Henüz bir ihtiyaç bildirmediniz.</Text>
            <Text style={styles.emptySubText}>"İhtiyaç Gir" sekmesinden başlayın.</Text>
          </View>
        )}

        {loading && <ActivityIndicator size="large" color="#e63946" style={{ marginTop: 24 }} />}

        {isClosed && (
          <View style={styles.closedBox}>
            <Text style={styles.closedText}>✅ Bu ihtiyaç kapatıldı.</Text>
          </View>
        )}

        {!loading && selectedNeedId && matches.length === 0 && !isClosed && (
          <Text style={styles.noResult}>Eşleşme bulunamadı.</Text>
        )}

        {!loading && matches.length > 0 && (
          <>
            <Text style={styles.resultsTitle}>En İyi Eşleşmeler</Text>
            {matches.map((match, index) => (
              <TouchableOpacity
                key={match.resourceId}
                style={styles.card}
                onPress={() => setSelectedMatch(match)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.rank}>#{index + 1}</Text>
                  <Text style={styles.category}>{match.category}</Text>
                  <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(match.hybrid_score) }]}>
                    <Text style={styles.scoreText}>{(match.hybrid_score * 100).toFixed(0)}%</Text>
                  </View>
                </View>
                <Text style={styles.description}>{match.description}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Mesafe</Text>
                    <Text style={styles.statValue}>{match.distance_km} km</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Metin</Text>
                    <Text style={styles.statValue}>{(match.semantic_score * 100).toFixed(0)}%</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Konum</Text>
                    <Text style={styles.statValue}>{(match.location_score * 100).toFixed(0)}%</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Hibrit</Text>
                    <Text style={[styles.statValue, { color: getScoreColor(match.hybrid_score) }]}>
                      {(match.hybrid_score * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.tapHint}>Detay için tıklayın →</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} disabled={closing}>
              <Text style={styles.closeButtonText}>{closing ? 'Kapatılıyor...' : '✅ Yardım Ulaştı — İhtiyacı Kapat'}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Modal visible={!!selectedMatch} transparent animationType="slide" onRequestClose={() => setSelectedMatch(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Eşleşme Detayı</Text>
            {selectedMatch && (
              <>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Kategori</Text>
                  <Text style={styles.modalValue}>{selectedMatch.category}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Açıklama</Text>
                  <Text style={styles.modalValue}>{selectedMatch.description}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Mesafe</Text>
                  <Text style={styles.modalValue}>{selectedMatch.distance_km} km</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Metin Benzerliği</Text>
                  <Text style={styles.modalValue}>{(selectedMatch.semantic_score * 100).toFixed(1)}%</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Konum Skoru</Text>
                  <Text style={styles.modalValue}>{(selectedMatch.location_score * 100).toFixed(1)}%</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Hibrit Skor</Text>
                  <Text style={[styles.modalValue, { color: getScoreColor(selectedMatch.hybrid_score), fontWeight: 'bold' }]}>
                    {(selectedMatch.hybrid_score * 100).toFixed(1)}%
                  </Text>
                </View>
              </>
            )}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedMatch(null)}>
              <Text style={styles.modalCloseBtnText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#e63946' },
  logoutBtn: { borderWidth: 1, borderColor: '#e63946', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  logoutBtnText: { color: '#e63946', fontWeight: '600', fontSize: 13 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  resultsTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 24, marginBottom: 8 },
  needBtn: { borderWidth: 1, borderColor: '#e63946', borderRadius: 10, padding: 14, marginBottom: 10, backgroundColor: '#fff' },
  needBtnActive: { backgroundColor: '#e63946', borderColor: '#e63946' },
  needBtnTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  needCategoryTag: { backgroundColor: '#fde8ea', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  needCategoryTagActive: { backgroundColor: '#fff' },
  needCategoryText: { color: '#e63946', fontWeight: '700', fontSize: 12 },
  needCategoryTextActive: { color: '#e63946' },
  needDesc: { fontSize: 14, color: '#333', lineHeight: 20 },
  needTextActive: { color: '#fff' },
  emptyBox: { padding: 24, alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, marginTop: 8 },
  emptyText: { fontSize: 15, color: '#555', fontWeight: '600' },
  emptySubText: { fontSize: 13, color: '#888', marginTop: 6 },
  noResult: { textAlign: 'center', color: '#888', marginTop: 32, fontSize: 16 },
  closedBox: { backgroundColor: '#f0fff4', borderWidth: 1, borderColor: '#2a9d8f', borderRadius: 8, padding: 16, marginTop: 16, alignItems: 'center' },
  closedText: { color: '#2a9d8f', fontWeight: '600', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  rank: { fontSize: 18, fontWeight: 'bold', color: '#333', width: 28 },
  category: { flex: 1, fontSize: 14, fontWeight: '600', color: '#555', backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  scoreBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  scoreText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  description: { fontSize: 15, color: '#333', marginBottom: 12, lineHeight: 22 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  stat: { alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  tapHint: { textAlign: 'right', color: '#aaa', fontSize: 11, marginTop: 8 },
  closeButton: { backgroundColor: '#2a9d8f', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  closeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalLabel: { fontSize: 14, color: '#888', flex: 1 },
  modalValue: { fontSize: 14, color: '#333', flex: 2, textAlign: 'right' },
  modalCloseBtn: { backgroundColor: '#e63946', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  modalCloseBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});