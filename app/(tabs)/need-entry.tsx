import * as Location from 'expo-location';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addNeed } from '../../api';
import { auth, db } from '../../firebaseConfig';

const CATEGORIES = ['Gıda', 'Barınak', 'Tıbbi', 'Giysi', 'Su', 'Diğer'];

export default function NeedEntryScreen() {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const getLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Konum izni verilmedi. Lütfen manuel girin.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitude(loc.coords.latitude.toString());
      setLongitude(loc.coords.longitude.toString());
      Alert.alert('Konum Alındı', `Enlem: ${loc.coords.latitude.toFixed(5)}\nBoylam: ${loc.coords.longitude.toFixed(5)}`);
    } catch (error) {
      Alert.alert('Hata', 'Konum alınamadı. Manuel girin.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!category || !description || !latitude || !longitude) {
      Alert.alert('Hata', 'Tüm alanları doldurun.');
      return;
    }
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid || 'anonymous';
      const response = await addNeed({
        userId,
        category,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });
      const needId = response.data.id;
      if (auth.currentUser) {
        try {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            needIds: arrayUnion(needId)
          });
        } catch (e) {
          console.log('needId kaydedilemedi:', e);
        }
      }
      Alert.alert('Başarılı ✅', 'İhtiyaç kaydedildi! "Eşleşmeler" sekmesinden görebilirsiniz.', [{ text: 'Tamam' }]);
      setCategory('');
      setDescription('');
      setLatitude('');
      setLongitude('');
    } catch (error) {
      Alert.alert('Hata', 'İhtiyaç kaydedilemedi. Backend çalışıyor mu?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>İhtiyaç Bildir</Text>
        <Text style={styles.label}>Kategori</Text>
        <View style={styles.categoryContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryBtn, category === cat && styles.categoryBtnActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Açıklama</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="İhtiyacınızı detaylı açıklayın..."
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
        <Text style={styles.label}>Konum</Text>
        <TouchableOpacity
          style={[styles.locationBtn, locationLoading && styles.locationBtnDisabled]}
          onPress={getLocation}
          disabled={locationLoading}
        >
          <Text style={styles.locationBtnText}>{locationLoading ? '📍 Konum alınıyor...' : '📍 GPS ile Konumu Al'}</Text>
        </TouchableOpacity>
        {latitude && longitude && (
          <View style={styles.locationBox}>
            <Text style={styles.locationText}>✅ Konum alındı</Text>
            <Text style={styles.locationCoords}>{parseFloat(latitude).toFixed(5)}, {parseFloat(longitude).toFixed(5)}</Text>
          </View>
        )}
        <Text style={styles.orText}>— veya manuel girin —</Text>
        <TextInput style={styles.input} placeholder="Enlem (örn: 37.06)" placeholderTextColor="#999" value={latitude} onChangeText={setLatitude} keyboardType="numeric" />
        <View style={{ height: 8 }} />
        <TextInput style={styles.input} placeholder="Boylam (örn: 37.38)" placeholderTextColor="#999" value={longitude} onChangeText={setLongitude} keyboardType="numeric" />
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Kaydediliyor...' : 'İhtiyacı Bildir'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#e63946', marginBottom: 24, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e63946' },
  categoryBtnActive: { backgroundColor: '#e63946' },
  categoryText: { color: '#e63946', fontSize: 14 },
  categoryTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, color: '#333' },
  textArea: { height: 100, textAlignVertical: 'top' },
  locationBtn: { backgroundColor: '#457b9d', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  locationBtnDisabled: { backgroundColor: '#aaa' },
  locationBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  locationBox: { backgroundColor: '#f0fff4', borderWidth: 1, borderColor: '#2a9d8f', borderRadius: 8, padding: 12, marginTop: 8 },
  locationText: { color: '#2a9d8f', fontWeight: '600', fontSize: 14 },
  locationCoords: { color: '#555', fontSize: 13, marginTop: 4 },
  orText: { textAlign: 'center', color: '#aaa', marginVertical: 12, fontSize: 13 },
  button: { backgroundColor: '#e63946', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});