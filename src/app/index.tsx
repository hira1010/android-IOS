import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Animated, ImageBackground } from 'react-native';

const PLAYER_MAX_HP = 100;
const ENEMY_MAX_HP = 120;
const ARENA_WIDTH = 400; 
const ARENA_HEIGHT = 300;

export default function WrestlingGame() {
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [enemyHp, setEnemyHp] = useState(ENEMY_MAX_HP);
  const [messages, setMessages] = useState<string[]>(['試合開始！十字キーで敵に近づいて技を決めろ！']);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  // プレイヤーと敵の座標を Animated.ValueXY で管理
  const playerPosition = useRef(new Animated.ValueXY({ x: 50, y: 120 })).current;
  const enemyPosition = useRef(new Animated.ValueXY({ x: 200, y: 120 })).current;

  // アニメーション用のOpacity
  const playerOpacity = useRef(new Animated.Value(1)).current;
  const enemyOpacity = useRef(new Animated.Value(1)).current;

  // 座標をトラッキングするためのリスナー（当たり判定用）
  const playerCoords = useRef({ x: 50, y: 120 });
  useEffect(() => {
    const listener = playerPosition.addListener(value => {
      playerCoords.current = value;
    });
    return () => playerPosition.removeListener(listener);
  }, []);

  const addMessage = (msg: string) => {
    setMessages(prev => {
      const newMessages = [...prev, msg];
      if (newMessages.length > 3) newMessages.shift();
      return newMessages;
    });
  };

  // 移動処理 (十字キー)
  const move = (dx: number, dy: number) => {
    if (isGameOver) return;
    let newX = playerCoords.current.x + dx;
    let newY = playerCoords.current.y + dy;
    
    // リング外に出ないように制限
    if (newX < -30) newX = -30;
    if (newX > ARENA_WIDTH - 100) newX = ARENA_WIDTH - 100;
    if (newY < 20) newY = 20; 
    if (newY > ARENA_HEIGHT - 120) newY = ARENA_HEIGHT - 120;

    // アニメーションでスムーズに移動させる
    Animated.timing(playerPosition, {
      toValue: { x: newX, y: newY },
      duration: 100,
      useNativeDriver: false 
    }).start();
  };

  // 当たり判定
  const checkHit = () => {
    const distX = playerCoords.current.x - 200; // 敵のX座標
    const distY = playerCoords.current.y - 120; // 敵のY座標
    const distance = Math.sqrt(distX * distX + distY * distY);
    return distance < 120; // 当たり判定を大きく
  };

  // 揺れ・点滅アニメーション
  const shakeAnimation = (target: 'player' | 'enemy') => {
    const targetAnim = target === 'player' ? playerPosition.x : enemyPosition.x;
    const opacityAnim = target === 'player' ? playerOpacity : enemyOpacity;
    const basePos = target === 'player' ? playerCoords.current.x : 200;
    
    Animated.sequence([
      Animated.timing(opacityAnim, { toValue: 0.3, duration: 50, useNativeDriver: false }),
      Animated.timing(targetAnim, { toValue: basePos - 15, duration: 50, useNativeDriver: false }),
      Animated.timing(targetAnim, { toValue: basePos + 15, duration: 50, useNativeDriver: false }),
      Animated.timing(targetAnim, { toValue: basePos, duration: 50, useNativeDriver: false }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 50, useNativeDriver: false })
    ]).start();
  };

  // 突進アニメーション
  const attackAnimation = (attacker: 'player' | 'enemy', callback: () => void) => {
    const moveAnimX = attacker === 'player' ? playerPosition.x : enemyPosition.x;
    const basePos = attacker === 'player' ? playerCoords.current.x : 200;
    const direction = attacker === 'player' ? 60 : -60;

    Animated.sequence([
      Animated.timing(moveAnimX, { toValue: basePos + direction, duration: 150, useNativeDriver: false }),
      Animated.timing(moveAnimX, { toValue: basePos, duration: 150, useNativeDriver: false })
    ]).start(() => {
      callback();
    });
  };

  const enemyAttack = () => {
    if (isGameOver) return;
    setTimeout(() => {
      attackAnimation('enemy', () => {
        const damage = Math.floor(Math.random() * 15) + 5;
        addMessage(`【敵の反撃】強烈なボディスラム！ あなたは ${damage} のダメージを受けた！`);
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
    
    if (!checkHit()) {
      addMessage(`【空振り】敵から遠すぎる！ ${moveName} が外れた！`);
      return;
    }

    setIsPlayerTurn(false);
    attackAnimation('player', () => {
      const damage = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
      addMessage(`【ヒット！】渾身の ${moveName} ！！ 敵に ${damage} のダメージ！`);
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
    setMessages(['試合開始！十字キーで敵に近づいて技を決めろ！']);
    setIsGameOver(false);
    setIsPlayerTurn(true);
    playerPosition.setValue({ x: 50, y: 120 });
  };

  const getHpWidth = (hp: number, maxHp: number) => `${(hp / maxHp) * 100}%`;
  const getHpColor = (hp: number, maxHp: number) => {
    const ratio = hp / maxHp;
    if (ratio > 0.5) return '#4caf50';
    if (ratio > 0.2) return '#ffeb3b';
    return '#f44336';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.hpBox}>
          <Text style={styles.nameText}>あなた</Text>
          <View style={styles.hpBarBackground}>
            <View style={[styles.hpBarFill, { width: getHpWidth(playerHp, PLAYER_MAX_HP) as any, backgroundColor: getHpColor(playerHp, PLAYER_MAX_HP) }]} />
          </View>
        </View>
        <View style={styles.hpBox}>
          <Text style={styles.nameTextEnemy}>ライバル</Text>
          <View style={styles.hpBarBackground}>
            <View style={[styles.hpBarFill, { width: getHpWidth(enemyHp, ENEMY_MAX_HP) as any, backgroundColor: getHpColor(enemyHp, ENEMY_MAX_HP) }]} />
          </View>
        </View>
      </View>

      <View style={styles.messageArea}>
        {messages.map((msg, idx) => (
          <Text key={idx} style={styles.messageText}>{msg}</Text>
        ))}
      </View>

      <View style={styles.arenaContainer}>
        <ImageBackground source={require('../../assets/images/ring.png')} style={styles.arena} resizeMode="cover">
          {/* 敵キャラクター */}
          <Animated.Image 
            source={require('../../assets/images/enemy.png')} 
            style={[styles.character, { left: enemyPosition.x, top: enemyPosition.y, opacity: enemyOpacity }]} 
            resizeMode="contain"
          />
          {/* プレイヤーキャラクター */}
          <Animated.Image 
            source={require('../../assets/images/player.png')} 
            style={[styles.character, { left: playerPosition.x, top: playerPosition.y, opacity: playerOpacity }]} 
            resizeMode="contain"
          />
        </ImageBackground>
      </View>

      <View style={styles.controllerArea}>
        {isGameOver ? (
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.buttonText}>もう一度戦う</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.controlRow}>
            {/* 十字キー (onPress => onPressIn に変更して即座に反応させる) */}
            <View style={styles.dpad}>
              <TouchableOpacity style={[styles.dpadBtn, styles.dpadUp]} onPressIn={() => move(0, -30)}>
                <Text style={styles.dpadText}>▲</Text>
              </TouchableOpacity>
              <View style={styles.dpadMiddleRow}>
                <TouchableOpacity style={[styles.dpadBtn, styles.dpadLeft]} onPressIn={() => move(-30, 0)}>
                  <Text style={styles.dpadText}>◀</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.dpadBtn, styles.dpadRight]} onPressIn={() => move(30, 0)}>
                  <Text style={styles.dpadText}>▶</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.dpadBtn, styles.dpadDown]} onPressIn={() => move(0, 30)}>
                <Text style={styles.dpadText}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionPad}>
              <TouchableOpacity style={[styles.actionBtn, !isPlayerTurn && styles.disabled]} onPress={() => attack('チョップ', 5, 10)}>
                <Text style={styles.buttonText}>チョップ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, !isPlayerTurn && styles.disabled]} onPress={() => attack('投げ技', 10, 20)}>
                <Text style={styles.buttonText}>投げ技</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.specialBtn, !isPlayerTurn && styles.disabled]} onPress={() => attack('必殺技', 20, 35)}>
                <Text style={styles.buttonText}>💥必殺💥</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#222', paddingTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 5 },
  hpBox: { flex: 1, backgroundColor: '#333', padding: 8, marginHorizontal: 5, borderRadius: 5 },
  nameText: { color: '#fff', fontWeight: 'bold', marginBottom: 2 },
  nameTextEnemy: { color: '#fff', fontWeight: 'bold', marginBottom: 2, textAlign: 'right' },
  hpBarBackground: { height: 12, backgroundColor: '#555', borderRadius: 5, overflow: 'hidden' },
  hpBarFill: { height: '100%' },
  messageArea: { height: 80, backgroundColor: '#111', padding: 8, marginHorizontal: 10, borderRadius: 5, justifyContent: 'flex-end' },
  messageText: { color: '#ffeb3b', fontSize: 13, marginBottom: 2 },
  arenaContainer: { flex: 1, margin: 10, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden' },
  arena: { flex: 1, width: '100%', height: '100%', position: 'relative' },
  character: { 
    width: 130, // キャラを大きく
    height: 160, 
    position: 'absolute',
    mixBlendMode: 'multiply' as any // 白背景を透過させるWeb用ハック
  }, 
  controllerArea: { height: 200, backgroundColor: '#333', padding: 10, borderTopWidth: 2, borderColor: '#555' },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 },
  dpad: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  dpadMiddleRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  dpadBtn: { width: 45, height: 45, backgroundColor: '#555', justifyContent: 'center', alignItems: 'center', borderRadius: 5 },
  dpadText: { color: '#fff', fontSize: 20 },
  dpadUp: { marginBottom: 5 },
  dpadDown: { marginTop: 5 },
  dpadLeft: { marginRight: 5 },
  dpadRight: { marginLeft: 5 },
  actionPad: { flex: 1, marginLeft: 20, justifyContent: 'center' },
  actionBtn: { backgroundColor: '#2196f3', padding: 12, borderRadius: 5, marginBottom: 8, alignItems: 'center' },
  specialBtn: { backgroundColor: '#ff9800', padding: 12, borderRadius: 5, alignItems: 'center' },
  resetButton: { backgroundColor: '#4caf50', padding: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flex: 1 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { opacity: 0.5 },
});
