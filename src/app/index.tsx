import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ImageBackground, Image } from 'react-native';

const PLAYER_MAX_HP = 100;
const ENEMY_MAX_HP = 120;
const ARENA_WIDTH = 400; 
const ARENA_HEIGHT = 300;
const ENEMY_POS = { x: 250, y: 150 };

export default function WrestlingGame() {
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [enemyHp, setEnemyHp] = useState(ENEMY_MAX_HP);
  const [messages, setMessages] = useState<string[]>(['試合開始！十字キーで敵に近づいて技を決めろ！']);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  // プレイヤーの座標を単純なStateで管理（確実に動くように）
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 150 });
  const [playerOpacity, setPlayerOpacity] = useState(1);
  const [enemyOpacity, setEnemyOpacity] = useState(1);

  const addMessage = (msg: string) => {
    setMessages(prev => {
      const newMessages = [...prev, msg];
      if (newMessages.length > 3) newMessages.shift();
      return newMessages;
    });
  };

  // 移動処理 (十字キー)
  const move = (dx: number, dy: number) => {
    if (isGameOver || !isPlayerTurn) return;
    setPlayerPos(prev => {
      let newX = prev.x + dx;
      let newY = prev.y + dy;
      
      // リング外に出ないように制限
      if (newX < -30) newX = -30;
      if (newX > ARENA_WIDTH - 100) newX = ARENA_WIDTH - 100;
      if (newY < 20) newY = 20; 
      if (newY > ARENA_HEIGHT - 120) newY = ARENA_HEIGHT - 120;

      // すり抜け防止（敵との衝突判定）
      const distX = Math.abs(newX - ENEMY_POS.x);
      const distY = Math.abs(newY - ENEMY_POS.y);
      if (distX < 60 && distY < 30) {
        // 敵と重なる場合は移動をキャンセルする
        return prev;
      }

      return { x: newX, y: newY };
    });
  };

  // 当たり判定（攻撃時）
  const checkHit = () => {
    const distX = playerPos.x - ENEMY_POS.x;
    const distY = playerPos.y - ENEMY_POS.y;
    const distance = Math.sqrt(distX * distX + distY * distY);
    return distance < 100; // 攻撃が届く距離
  };

  // 揺れ・点滅アニメーションの代替（Stateでシンプルに実装）
  const shakeAnimation = (target: 'player' | 'enemy') => {
    const setOpacity = target === 'player' ? setPlayerOpacity : setEnemyOpacity;
    setOpacity(0.3);
    setTimeout(() => setOpacity(1), 150);
  };

  const enemyAttack = () => {
    if (isGameOver) return;
    setTimeout(() => {
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
    }, 1000);
  };

  const attack = (moveName: string, minDmg: number, maxDmg: number) => {
    if (isGameOver || !isPlayerTurn) return;
    
    if (!checkHit()) {
      addMessage(`【空振り】敵から遠すぎる！ ${moveName} が外れた！`);
      return;
    }

    setIsPlayerTurn(false);
    
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
  };

  const resetGame = () => {
    setPlayerHp(PLAYER_MAX_HP);
    setEnemyHp(ENEMY_MAX_HP);
    setMessages(['試合開始！十字キーで敵に近づいて技を決めろ！']);
    setIsGameOver(false);
    setIsPlayerTurn(true);
    setPlayerPos({ x: 50, y: 150 });
  };

  const getHpWidth = (hp: number, maxHp: number) => `${(hp / maxHp) * 100}%`;
  const getHpColor = (hp: number, maxHp: number) => {
    const ratio = hp / maxHp;
    if (ratio > 0.5) return '#4caf50';
    if (ratio > 0.2) return '#ffeb3b';
    return '#f44336';
  };

  // 常に対峙するための向き計算
  const isPlayerRight = playerPos.x > ENEMY_POS.x;
  const playerScaleX = isPlayerRight ? -1 : 1;
  const enemyScaleX = isPlayerRight ? 1 : -1;

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
          <Image 
            source={require('../../assets/images/enemy.png')} 
            style={[
              styles.character, 
              { left: ENEMY_POS.x, top: ENEMY_POS.y, opacity: enemyOpacity, zIndex: ENEMY_POS.y, transform: [{ scaleX: enemyScaleX }] }
            ]} 
            resizeMode="contain"
          />
          {/* プレイヤーキャラクター */}
          <Image 
            source={require('../../assets/images/player.png')} 
            style={[
              styles.character, 
              { left: playerPos.x, top: playerPos.y, opacity: playerOpacity, zIndex: playerPos.y, transform: [{ scaleX: playerScaleX }] }
            ]} 
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
            {/* 十字キー (onPress で確実に反応させる) */}
            <View style={styles.dpad}>
              <TouchableOpacity style={[styles.dpadBtn, styles.dpadUp]} onPress={() => move(0, -30)}>
                <Text style={styles.dpadText}>▲</Text>
              </TouchableOpacity>
              <View style={styles.dpadMiddleRow}>
                <TouchableOpacity style={[styles.dpadBtn, styles.dpadLeft]} onPress={() => move(-30, 0)}>
                  <Text style={styles.dpadText}>◀</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.dpadBtn, styles.dpadRight]} onPress={() => move(30, 0)}>
                  <Text style={styles.dpadText}>▶</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.dpadBtn, styles.dpadDown]} onPress={() => move(0, 30)}>
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
    width: 140, 
    height: 160, 
    position: 'absolute'
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
