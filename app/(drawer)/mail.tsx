import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, Portal, Dialog, TextInput, Card, Divider, List } from 'react-native-paper';
import { mailService, AttachmentFile } from '../services/mailService';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';

export default function Mail() {
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    body: '',
    attachments: [] as AttachmentFile[]
  });

  const handleDocumentSelection = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Tüm dosya tiplerini kabul et
        multiple: true // Çoklu dosya seçimine izin ver
      });

      if (!result.canceled) {
        const newFiles = result.assets.map(file => ({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream'
        }));

        setEmailForm(prev => ({
          ...prev,
          attachments: [...prev.attachments, ...newFiles]
        }));
      }
    } catch (err) {
      console.error('Dosya seçimi hatası:', err);
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Dosya seçimi başarısız oldu',
      });
    }
  };

  const removeAttachment = (index: number) => {
    setEmailForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSendMail = async () => {
    setLoading(true);
    try {
      await mailService.triggerEmailReport();
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'E-posta raporları gönderildi',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'E-posta raporları gönderilemedi',
      });
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  const handleSendSingleMail = async () => {
    if (!emailForm.to || !emailForm.subject || !emailForm.body) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Lütfen tüm alanları doldurun',
      });
      return;
    }

    setLoading(true);
    try {
      await mailService.sendEmail(emailForm);
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'E-posta gönderildi',
      });
      // Form alanlarını temizle
      setEmailForm({
        to: '',
        subject: '',
        body: '',
        attachments: []
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'E-posta gönderilemedi',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>E-posta Yönetimi</Text>
        <Button
          mode="contained"
          onPress={() => setShowConfirmDialog(true)}
          loading={loading}
          disabled={loading}
          style={styles.sendButton}
        >
          Toplu Portföy Gönder
        </Button>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Tekil E-posta Gönder</Text>
            <Divider style={styles.divider} />
            
            <TextInput
              label="Alıcı E-posta"
              value={emailForm.to}
              onChangeText={(text) => setEmailForm(prev => ({ ...prev, to: text }))}
              mode="outlined"
              style={styles.input}
              disabled={loading}
            />
            
            <TextInput
              label="Konu"
              value={emailForm.subject}
              onChangeText={(text) => setEmailForm(prev => ({ ...prev, subject: text }))}
              mode="outlined"
              style={styles.input}
              disabled={loading}
            />
            
            <TextInput
              label="İçerik"
              value={emailForm.body}
              onChangeText={(text) => setEmailForm(prev => ({ ...prev, body: text }))}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              disabled={loading}
            />

            {/* <Button
              mode="outlined"
              onPress={handleDocumentSelection}
              icon="attachment"
              style={styles.attachButton}
              disabled={loading}
            >
              Dosya Ekle
            </Button> */}

            {emailForm.attachments.length > 0 && (
              <Card style={styles.attachmentsCard}>
                <Card.Content>
                  <Text style={styles.attachmentsTitle}>Ekli Dosyalar:</Text>
                  {emailForm.attachments.map((file, index) => (
                    <List.Item
                      key={index}
                      title={file.name}
                      left={props => <List.Icon {...props} icon="file" />}
                      right={() => (
                        <Button
                          onPress={() => removeAttachment(index)}
                          icon="close"
                        >
                          {''}
                        </Button>
                      )}
                    />
                  ))}
                </Card.Content>
              </Card>
            )}
            
            <Button
              mode="contained"
              onPress={handleSendSingleMail}
              loading={loading}
              disabled={loading}
              style={styles.singleMailButton}
            >
              Gönder
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Dialog visible={showConfirmDialog} onDismiss={() => setShowConfirmDialog(false)}>
          <Dialog.Title>E-posta Gönderimi</Dialog.Title>
          <Dialog.Content>
            <Text>Tüm kullanıcılara portföy raporu göndermek istediğinize emin misiniz?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowConfirmDialog(false)}>İptal</Button>
            <Button onPress={handleSendMail} loading={loading}>Gönder</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B4371',
  },
  sendButton: {
    backgroundColor: '#1B4371',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B4371',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  attachButton: {
    marginBottom: 16,
  },
  attachmentsCard: {
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  attachmentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  singleMailButton: {
    backgroundColor: '#1B4371',
    marginTop: 8,
  },
}); 