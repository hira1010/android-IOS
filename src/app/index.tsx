import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Animated, ImageBackground } from 'react-native';

const PLAYER_MAX_HP = 100;
const ENEMY_MAX_HP = 120;
const ARENA_WIDTH = 300;
const ARENA_HEIGHT = 200;
const ENEMY_POS = { x: 200, y: 100 }; // 敵は右側に固定

export default function WrestlingGame() {
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [enemyHp, setEnemyHp] = useState(ENEMY_MAX_HP);
  const [messages, setMessages] = useState<string[]>(['試合開始！敵に近づいて技を決めろ！']);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  // プレイヤーの座標 (左上が 0,0)
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 100 });

  const addMessage = (msg: string) => {
    setMessages(prev => {
      const newMessages = [...prev, msg];
      if (newMessages.length > 3) newMessages.shift(); // 最新3件だけ表示
      return newMessages;
    });
  };

  // 移動処理
  const move = (dx: number, dy: number) => {
    if (isGameOver) return;
    setPlayerPos(prev => {
      let newX = prev.x + dx;
      let newY = prev.y + dy;
      // 画面外（リング外）に出ないように制限
      if (newX < 0) newX = 0;
      if (newX > ARENA_WIDTH - 50) newX = ARENA_WIDTH - 50; // キャラの幅を考慮
      if (newY < 0) newY = 0;
      if (newY > ARENA_HEIGHT - 60) newY = ARENA_HEIGHT - 60; // キャラの高さを考慮
      return { x: newX, y: newY };
    });
  };

  // 当たり判定
  const checkHit = () => {
    const distX = playerPos.x - ENEMY_POS.x;
    const distY = playerPos.y - ENEMY_POS.y;
    const distance = Math.sqrt(distX * distX + distY * distY);
    return distance < 80; // 80ピクセル以内ならヒット
  };

  const enemyAttack = () => {
    if (isGameOver) return;
    setTimeout(() => {
      const damage = Math.floor(Math.random() * 15) + 5;
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

  const attack = (moveName: string, minDmg: number, maxDmg: number) => {
    if (isGameOver || !isPlayerTurn) return;
    
    // 当たり判定チェック
    if (!checkHit()) {
      addMessage(`【空振り】敵から遠すぎる！ ${moveName} が外れた！`);
      return; // 空振りの場合はターン継続
    }

    setIsPlayerTurn(false);
    const damage = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
    addMessage(`【ヒット！】渾身の ${moveName} ！！ 敵に ${damage} のダメージ！`);
    
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
    setMessages(['試合開始！敵に近づいて技を決めろ！']);
    setIsGameOver(false);
    setIsPlayerTurn(true);
    setPlayerPos({ x: 50, y: 100 });
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
      {/* 上部ステータスバー */}
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

      {/* メッセージエリア */}
      <View style={styles.messageArea}>
        {messages.map((msg, idx) => (
          <Text key={idx} style={styles.messageText}>{msg}</Text>
        ))}
      </View>

      {/* 闘技場（リング） */}
      <View style={styles.arenaContainer}>
        <ImageBackground source={require('../../assets/images/ring.png')} style={styles.arena} resizeMode="cover">
          {/* 敵キャラクター（固定） */}
          <Animated.Image 
            source={require('../../assets/images/enemy.png')} 
            style={[styles.character, { left: ENEMY_POS.x, top: ENEMY_POS.y }]} 
            resizeMode="contain"
          />
          {/* プレイヤーキャラクター */}
          <Animated.Image 
            source={require('../../assets/images/player.png')} 
            style={[styles.character, { left: playerPos.x, top: playerPos.y }]} 
            resizeMode="contain"
          />
        </ImageBackground>
      </View>

      {/* コントローラーエリア */}
      <View style={styles.controllerArea}>
        {isGameOver ? (
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.buttonText}>もう一度戦う</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.controlRow}>
            {/* 左側：十字キー */}
            <View style={styles.dpad}>
              <TouchableOpacity style={[styles.dpadBtn, styles.dpadUp]} onPress={() => move(0, -20)}>
                <Text style={styles.dpadText}>▲</Text>
              </TouchableOpacity>
              <View style={styles.dpadMiddleRow}>
                <TouchableOpacity style={[styles.dpadBtn, styles.dpadLeft]} onPress={() => move(-20, 0)}>
                  <Text style={styles.dpadText}>◀</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.dpadBtn, styles.dpadRight]} onPress={() => move(20, 0)}>
                  <Text style={styles.dpadText}>▶</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.dpadBtn, styles.dpadDown]} onPress={() => move(0, 20)}>
                <Text style={styles.dpadText}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* 右側：アクションボタン */}
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
  container: { flex: 1, backgroundColor: '#222', paddingTop: 30 },
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
  character: { width: 60, height: 80, position: 'absolute' },
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
