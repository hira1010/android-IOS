import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ImageBackground, Image, PanResponder, Animated } from 'react-native';

const ARENA_WIDTH = 400; 
const ARENA_HEIGHT = 300;
const ENEMY_POS = { x: 250, y: 150 };

export default function WrestlingGame() {
  const [messages, setMessages] = useState<string[]>(['試合開始！ジョイスティックで移動、ボタンで技！']);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  // 必殺技ゲージ (0 ~ 100)
  const [specialGauge, setSpecialGauge] = useState(0);

  // 初期位置を端からもう少し中央に寄せる（X: 100 に変更）
  const [playerPos, setPlayerPos] = useState({ x: 100, y: 150 });
  const [playerOpacity, setPlayerOpacity] = useState(1);
  const [enemyOpacity, setEnemyOpacity] = useState(1);

  // ジョイスティックのツマミ位置
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  
  // ボタン長押し判定用
  const pressStartRef = useRef<{ [key: string]: number }>({});

  // 必殺技ボタンの点滅アニメーション
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: false })
      ])
    ).start();
  }, []);

  // ジョイスティックのPanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const maxDist = 30;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const ratio = dist > maxDist ? maxDist / dist : 1;
        setJoystickPos({ x: dx * ratio, y: dy * ratio });
        
        // ジョイスティックの傾きに応じて移動
        if (!isGameOver) {
          setPlayerPos(prev => {
            let newX = prev.x + (dx * ratio * 0.1);
            let newY = prev.y + (dy * ratio * 0.1);
            if (newX < -30) newX = -30;
            if (newX > ARENA_WIDTH - 100) newX = ARENA_WIDTH - 100;
            if (newY < 20) newY = 20; 
            if (newY > ARENA_HEIGHT - 120) newY = ARENA_HEIGHT - 120;
            return { x: newX, y: newY };
          });
        }
      },
      onPanResponderRelease: () => {
        setJoystickPos({ x: 0, y: 0 });
      }
    })
  ).current;

  const addMessage = (msg: string) => {
    setMessages(prev => {
      const newMessages = [...prev, msg];
      if (newMessages.length > 3) newMessages.shift();
      return newMessages;
    });
  };

  // ダッシュ処理（向いている方向へ高速移動）
  const dash = () => {
    if (isGameOver) return;
    const isFacingRight = playerPos.x <= ENEMY_POS.x;
    const direction = isFacingRight ? 1 : -1;
    const dashDistance = 80; // 1回のダッシュで進む距離
    
    setPlayerPos(prev => {
      let newX = prev.x + (direction * dashDistance);
      // リング外に出ないように制限
      if (newX < -30) newX = -30;
      if (newX > ARENA_WIDTH - 100) newX = ARENA_WIDTH - 100;
      return { ...prev, x: newX };
    });
    addMessage('💨 猛ダッシュ！！！');
  };

  const handlePressIn = (actionType: string) => {
    pressStartRef.current[actionType] = Date.now();
  };

  const handlePressOut = (actionType: string) => {
    const duration = Date.now() - (pressStartRef.current[actionType] || 0);
    const isStrong = duration > 300; // 300ms以上で強攻撃
    executeAction(actionType, isStrong);
  };

  const executeAction = (actionType: string, isStrong: boolean) => {
    if (isGameOver) return;
    
    if (actionType === 'dash') {
      dash();
      return; // ダッシュは専用の処理を実行
    }

    let actionName = '';
    if (actionType === 'strike') actionName = isStrong ? 'ドロップキック (強打撃)' : 'チョップ (弱打撃)';
    if (actionType === 'throw') actionName = isStrong ? 'パワーボム (強投げ)' : '投げ技 (弱投げ)';
    if (actionType === 'submission') actionName = isStrong ? '脇固め (強関節)' : '関節技 (弱関節)';
    if (actionType === 'ukemi') actionName = '受け身待機';
    if (actionType === 'special') actionName = '💥 必殺技発動 💥';

    addMessage(`【${actionName}】を発動！`);

    // 技を出したらゲージが溜まる
    if (actionType !== 'special') {
      setSpecialGauge(prev => Math.min(100, prev + 10));
    } else {
      setSpecialGauge(0);
    }
  };

  // 常に対峙するための向き計算
  const isPlayerRight = playerPos.x > ENEMY_POS.x;
  const playerScaleX = isPlayerRight ? -1 : 1;
  const enemyScaleX = isPlayerRight ? 1 : -1;

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffd700', '#fffacd'] // ゴールドから薄いイエローへ
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* 上部ステータス（体力ゲージ廃止、必殺技ゲージのみ） */}
      <View style={styles.header}>
        <View style={styles.hpBox}>
          <Text style={styles.nameText}>必殺技ゲージ</Text>
          <View style={styles.hpBarBackground}>
            <View style={[styles.specialBarFill, { width: `${specialGauge}%` }]} />
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
            style={[styles.character, { left: ENEMY_POS.x, top: ENEMY_POS.y, opacity: enemyOpacity, zIndex: ENEMY_POS.y, transform: [{ scaleX: enemyScaleX }] }]} 
            resizeMode="contain"
          />
          {/* プレイヤーキャラクター */}
          <Image 
            source={require('../../assets/images/player.png')} 
            style={[styles.character, { left: playerPos.x, top: playerPos.y, opacity: playerOpacity, zIndex: playerPos.y, transform: [{ scaleX: playerScaleX }] }]} 
            resizeMode="contain"
          />
        </ImageBackground>
      </View>

      <View style={styles.controllerArea}>
        <View style={styles.controlRow}>
          {/* 左側：仮想ジョイスティック */}
          <View style={styles.joystickArea}>
            <View style={styles.joystickBase} {...panResponder.panHandlers}>
              <View style={[styles.joystickStick, { transform: [{ translateX: joystickPos.x }, { translateY: joystickPos.y }] }]} />
            </View>
          </View>

          {/* 右側：6アクションボタン (縦2列 x 3個) */}
          <View style={styles.actionPad}>
            <View style={styles.buttonCol}>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: '#f44336' }]} // レッド
                onPressIn={() => handlePressIn('strike')}
                onPressOut={() => handlePressOut('strike')}
              >
                <Text style={styles.btnText}>打撃</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: '#4caf50' }]} // グリーン
                onPressIn={() => handlePressIn('throw')}
                onPressOut={() => handlePressOut('throw')}
              >
                <Text style={styles.btnText}>投げ</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: '#9c27b0' }]} // パープル
                onPressIn={() => handlePressIn('submission')}
                onPressOut={() => handlePressOut('submission')}
              >
                <Text style={styles.btnText}>関節技</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonCol}>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: '#ff9800' }]} // オレンジ
                onPressIn={() => handlePressIn('dash')}
                onPressOut={() => handlePressOut('dash')}
              >
                <Text style={styles.btnText}>ダッシュ</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: '#2196f3' }]} // ブルー
                onPressIn={() => handlePressIn('ukemi')}
                onPressOut={() => handlePressOut('ukemi')}
              >
                <Text style={styles.btnText}>受け身</Text>
              </TouchableOpacity>
              <Animated.View style={[styles.btn, { backgroundColor: glowColor, borderColor: '#ffb300', borderWidth: 2 }]}> 
                <TouchableOpacity 
                  style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}
                  onPressIn={() => handlePressIn('special')}
                  onPressOut={() => handlePressOut('special')}
                  disabled={specialGauge < 100}
                >
                  <Text style={[styles.btnText, { color: '#000', fontWeight: '900' }]}>必殺技</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#222', paddingTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 10, marginBottom: 5 },
  hpBox: { flex: 1, backgroundColor: '#333', padding: 8, marginHorizontal: 5, borderRadius: 5, maxWidth: 300 },
  nameText: { color: '#ffd700', fontWeight: 'bold', marginBottom: 2, textAlign: 'center' },
  hpBarBackground: { height: 15, backgroundColor: '#555', borderRadius: 5, overflow: 'hidden' },
  specialBarFill: { height: '100%', backgroundColor: '#ffeb3b' },
  messageArea: { height: 70, backgroundColor: '#111', padding: 8, marginHorizontal: 10, borderRadius: 5, justifyContent: 'flex-end' },
  messageText: { color: '#ffeb3b', fontSize: 13, marginBottom: 2 },
  arenaContainer: { flex: 1, margin: 10, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden' },
  arena: { flex: 1, width: '100%', height: '100%', position: 'relative' },
  character: { width: 140, height: 160, position: 'absolute' }, 
  controllerArea: { height: 220, backgroundColor: '#333', padding: 10, borderTopWidth: 2, borderColor: '#555' },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 },
  joystickArea: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  joystickBase: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#555', justifyContent: 'center', alignItems: 'center' },
  joystickStick: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#999', borderWidth: 2, borderColor: '#fff' },
  actionPad: { flex: 1, marginLeft: 10, flexDirection: 'row', justifyContent: 'space-around' },
  buttonCol: { justifyContent: 'space-around', height: '100%', width: '45%' },
  btn: { paddingVertical: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginVertical: 3, flex: 1 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
