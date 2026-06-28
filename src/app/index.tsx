import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Animated, Image } from 'react-native';

const PLAYER_MAX_HP = 100;
const ENEMY_MAX_HP = 120;

export default function WrestlingGame() {
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [enemyHp, setEnemyHp] = useState(ENEMY_MAX_HP);
  const [messages, setMessages] = useState<string[]>(['試合開始！両者、リングの中央で見合っています！']);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);

  // アニメーション用の値
  const playerTranslateX = useRef(new Animated.Value(0)).current;
  const enemyTranslateX = useRef(new Animated.Value(0)).current;
  const playerOpacity = useRef(new Animated.Value(1)).current;
  const enemyOpacity = useRef(new Animated.Value(1)).current;

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev, msg]);
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // ダメージ演出（点滅と揺れ）
  const shakeAnimation = (target: 'player' | 'enemy') => {
    const targetAnim = target === 'player' ? playerTranslateX : enemyTranslateX;
    const opacityAnim = target === 'player' ? playerOpacity : enemyOpacity;
    
    Animated.sequence([
      Animated.timing(opacityAnim, { toValue: 0.5, duration: 50, useNativeDriver: true }),
      Animated.timing(targetAnim, { toValue: target === 'player' ? -10 : 10, duration: 50, useNativeDriver: true }),
      Animated.timing(targetAnim, { toValue: target === 'player' ? 10 : -10, duration: 50, useNativeDriver: true }),
      Animated.timing(targetAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 50, useNativeDriver: true })
    ]).start();
  };

  // 攻撃演出（突進）
  const attackAnimation = (attacker: 'player' | 'enemy', callback: () => void) => {
    const moveAnim = attacker === 'player' ? playerTranslateX : enemyTranslateX;
    const direction = attacker === 'player' ? 50 : -50;

    Animated.sequence([
      // 飛び込み
      Animated.timing(moveAnim, { toValue: direction, duration: 200, useNativeDriver: true }),
      // 少し止まる（ヒット）
      Animated.delay(100),
      // 元の位置に戻る
      Animated.timing(moveAnim, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start(() => {
      // 演出後にHP計算等のコールバック実行
      callback();
    });
  };

  const enemyAttack = () => {
    if (isGameOver) return;
    
    setTimeout(() => {
      // 敵の攻撃アニメーション開始
      attackAnimation('enemy', () => {
        const damage = Math.floor(Math.random() * 15) + 5;
        addMessage(`【敵の反撃】強烈なボディスラム！ あなたは ${damage} のダメージを受けた！`);
        
        // プレイヤーがダメージアニメーション
        shakeAnimation('player');

        setPlayerHp(prev => {
          const newHp = Math.max(0, prev - damage);
          if (newHp === 0) {
            setIsGameOver(true);
            addMessage('1... 2... 3... カンカンカン！ あなたは負けてしまった...');
          }
          return newHp;
        });
        setIsPlayerTurn(true);
      });
    }, 1500);
  };

  const attack = (moveName: string, minDmg: number, maxDmg: number) => {
    if (isGameOver || !isPlayerTurn) return;
    
    setIsPlayerTurn(false);

    // プレイヤーの攻撃アニメーション開始
    attackAnimation('player', () => {
      const damage = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
      addMessage(`【あなたの攻撃】渾身の ${moveName} ！！ 敵に ${damage} のダメージ！`);
      
      // 敵がダメージアニメーション
      shakeAnimation('enemy');

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
    });
  };

  const resetGame = () => {
    setPlayerHp(PLAYER_MAX_HP);
    setEnemyHp(ENEMY_MAX_HP);
    setMessages(['試合開始！両者、リングの中央で見合っています！']);
    setIsGameOver(false);
    setIsPlayerTurn(true);
  };

  const getHpWidth = (hp: number, maxHp: number) => {
    return `${(hp / maxHp) * 100}%`;
  };

  const getHpColor = (hp: number, maxHp: number) => {
    const ratio = hp / maxHp;
    if (ratio > 0.5) return '#4caf50';
    if (ratio > 0.2) return '#ffeb3b';
    return '#f44336';
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

      {/* キャラクター闘技場（リング） */}
      <View style={styles.battleArena}>
        <Animated.Image 
          source={require('../../assets/images/player.png')} 
          style={[styles.characterImage, { transform: [{ translateX: playerTranslateX }], opacity: playerOpacity }]} 
          resizeMode="contain"
        />
        <Text style={styles.vsText}>VS</Text>
        <Animated.Image 
          source={require('../../assets/images/enemy.png')} 
          style={[styles.characterImage, { transform: [{ translateX: enemyTranslateX }], opacity: enemyOpacity }]} 
          resizeMode="contain"
        />
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
  battleArena: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 150,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#444',
    marginVertical: 5,
    overflow: 'hidden',
  },
  characterImage: {
    width: 100,
    height: 120,
  },
  vsText: {
    color: '#ffeb3b',
    fontSize: 24,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  statusBox: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    borderWidth: 2,
    borderColor: '#555',
  },
  nameText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  hpBarBackground: {
    height: 15,
    backgroundColor: '#555',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 5,
  },
  hpBarFill: {
    height: '100%',
  },
  hpText: {
    color: '#ddd',
    textAlign: 'right',
    fontSize: 12,
  },
  ringArea: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#d32f2f',
    marginVertical: 5,
    padding: 10,
  },
  messageScroll: {
    flex: 1,
  },
  messageContainer: {
    paddingBottom: 10,
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
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
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  specialButton: {
    flex: 1,
    backgroundColor: '#ff9800',
    padding: 12,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
});
