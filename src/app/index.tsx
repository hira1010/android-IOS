import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';

// キャラクターの初期データ
const PLAYER_MAX_HP = 100;
const ENEMY_MAX_HP = 120;

export default function WrestlingGame() {
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [enemyHp, setEnemyHp] = useState(ENEMY_MAX_HP);
  const [messages, setMessages] = useState<string[]>(['試合開始！両者、リングの中央で見合っています！']);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);

  // メッセージを追加する関数
  const addMessage = (msg: string) => {
    setMessages(prev => [...prev, msg]);
  };

  // メッセージが追加されたら一番下へスクロール
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // 敵のターン
  const enemyAttack = () => {
    if (isGameOver) return;
    
    setTimeout(() => {
      const damage = Math.floor(Math.random() * 15) + 5; // 5〜19のダメージ
      addMessage(`【敵の反撃】強烈なボディスラム！ あなたは ${damage} のダメージを受けた！`);
      
      setPlayerHp(prev => {
        const newHp = Math.max(0, prev - damage);
        if (newHp === 0) {
          setIsGameOver(true);
          addMessage('1... 2... 3... カンカンカン！ あなたは負けてしまった...');
        }
        return newHp;
      });
      setIsPlayerTurn(true);
    }, 1500);
  };

  // プレイヤーの攻撃
  const attack = (moveName: string, minDmg: number, maxDmg: number) => {
    if (isGameOver || !isPlayerTurn) return;
    
    setIsPlayerTurn(false);
    const damage = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
    
    addMessage(`【あなたの攻撃】渾身の ${moveName} ！！ 敵に ${damage} のダメージ！`);
    
    setEnemyHp(prev => {
      const newHp = Math.max(0, prev - damage);
      if (newHp === 0) {
        setIsGameOver(true);
        addMessage('1... 2... 3... カンカンカン！ あなたの勝利です！！！');
      } else {
        enemyAttack();
      }
      return newHp;
    });
  };

  // リセット
  const resetGame = () => {
    setPlayerHp(PLAYER_MAX_HP);
    setEnemyHp(ENEMY_MAX_HP);
    setMessages(['試合開始！両者、リングの中央で見合っています！']);
    setIsGameOver(false);
    setIsPlayerTurn(true);
  };

  // HPバーの幅を計算
  const getHpWidth = (hp: number, maxHp: number) => {
    return `${(hp / maxHp) * 100}%`;
  };

  // HPバーの色（減ると赤くなる）
  const getHpColor = (hp: number, maxHp: number) => {
    const ratio = hp / maxHp;
    if (ratio > 0.5) return '#4caf50'; // 緑
    if (ratio > 0.2) return '#ffeb3b'; // 黄
    return '#f44336'; // 赤
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 敵のステータス */}
      <View style={styles.statusBox}>
        <Text style={styles.nameText}>ライバルレスラー</Text>
        <View style={styles.hpBarBackground}>
          <View style={[styles.hpBarFill, { width: getHpWidth(enemyHp, ENEMY_MAX_HP) as any, backgroundColor: getHpColor(enemyHp, ENEMY_MAX_HP) }]} />
        </View>
        <Text style={styles.hpText}>{enemyHp} / {ENEMY_MAX_HP}</Text>
      </View>

      {/* リング（実況メッセージエリア） */}
      <View style={styles.ringArea}>
        <ScrollView ref={scrollViewRef} style={styles.messageScroll} contentContainerStyle={styles.messageContainer}>
          {messages.map((msg, index) => (
            <Text key={index} style={styles.messageText}>{msg}</Text>
          ))}
        </ScrollView>
      </View>

      {/* プレイヤーのステータス */}
      <View style={styles.statusBox}>
        <Text style={styles.nameText}>あなた (You)</Text>
        <View style={styles.hpBarBackground}>
          <View style={[styles.hpBarFill, { width: getHpWidth(playerHp, PLAYER_MAX_HP) as any, backgroundColor: getHpColor(playerHp, PLAYER_MAX_HP) }]} />
        </View>
        <Text style={styles.hpText}>{playerHp} / {PLAYER_MAX_HP}</Text>
      </View>

      {/* コントローラー（技ボタン） */}
      <View style={styles.controllerArea}>
        {isGameOver ? (
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.buttonText}>もう一度戦う</Text>
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.actionButton, !isPlayerTurn && styles.disabledButton]} 
                onPress={() => attack('逆水平チョップ', 5, 10)}
                disabled={!isPlayerTurn}
              >
                <Text style={styles.buttonText}>チョップ</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, !isPlayerTurn && styles.disabledButton]} 
                onPress={() => attack('ブレーンバスター', 10, 20)}
                disabled={!isPlayerTurn}
              >
                <Text style={styles.buttonText}>投げ技</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.specialButton, !isPlayerTurn && styles.disabledButton]} 
                onPress={() => attack('必殺！シャイニング・ウィザード', 20, 35)}
                disabled={!isPlayerTurn}
              >
                <Text style={styles.buttonText}>💥 必殺技 💥</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
    padding: 10,
    justifyContent: 'space-between',
  },
  statusBox: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#555',
  },
  nameText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  hpBarBackground: {
    height: 20,
    backgroundColor: '#555',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 5,
  },
  hpBarFill: {
    height: '100%',
  },
  hpText: {
    color: '#ddd',
    textAlign: 'right',
    fontSize: 14,
  },
  ringArea: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#d32f2f', // リングのロープをイメージした赤
    marginVertical: 5,
    padding: 10,
  },
  messageScroll: {
    flex: 1,
  },
  messageContainer: {
    paddingBottom: 20,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  controllerArea: {
    padding: 10,
    backgroundColor: '#444',
    borderRadius: 8,
    marginTop: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2196f3',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  specialButton: {
    flex: 1,
    backgroundColor: '#ff9800',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
