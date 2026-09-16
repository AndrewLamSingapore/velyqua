import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

const projects: Array<[string, string, string]> = [
  ['Authority Engine', 'Operations, analytics and Andrew’s work', 'https://authority-engine-app.vercel.app/'],
  ['The Portal', 'Explore connections between ideas', 'https://the-portal-ten.vercel.app/'],
  ['Living Worlds', 'Make a choice in an interactive world', 'https://game-platform-wine-nine.vercel.app/'],
  ['Sky Tablet', 'An ancient city and a living sky', 'https://sky-tablet.vercel.app/'],
];

export function CreatorConnection() {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');
  const open = (url: string) => { setError(''); void Linking.openURL(url).catch(() => setError('The link could not open. Please try again when connected.')); };
  return <View style={s.card}>
    <Text style={s.kicker}>BUILT BY ANDREW LAM · OPEN TO YOUR IDEAS</Text>
    <Text accessibilityRole="header" style={s.title}>Your aquarium could shape what comes next.</Text>
    <Text style={s.body}>Keep an aquarium? Tell me which part of its care you wish were easier. I’m interested in practical feedback, research and people who want to help shape VELYQUA.</Text>
    <View style={s.actions}>
      <Pressable accessibilityRole="link" onPress={() => open('https://authority-engine-app.vercel.app/contact?source=velyqua&intent=collaboration')} style={s.primary}><Text style={s.primaryText}>Talk water with Andrew ↗</Text></Pressable>
      <Pressable accessibilityRole="link" onPress={() => open('https://www.linkedin.com/in/lam-teck-sing-andrew-79886719')} style={s.secondary}><Text style={s.secondaryText}>Connect on LinkedIn ↗</Text></Pressable>
    </View>
    <Text style={s.note}>Working software prototype. Physical sensor validation is still in progress.</Text>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={s.explore}><Text style={s.secondaryText}>{expanded ? '−' : '+'} Explore Andrew’s other projects</Text></Pressable>
    {expanded && <View style={s.projects}>{projects.map(([title, description, url]) => <Pressable key={title} accessibilityRole="link" onPress={() => open(url)} style={s.project}><Text style={s.projectTitle}>{title} ↗</Text><Text style={s.projectText}>{description}</Text></Pressable>)}</View>}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  </View>;
}
const s=StyleSheet.create({
 card:{marginTop:24,padding:24,borderRadius:24,backgroundColor:'#103b3d',borderWidth:1,borderColor:'#28615e'},
 kicker:{color:'#9cdacc',fontSize:10,fontWeight:'800',letterSpacing:1.3,lineHeight:16},
 title:{color:'#f0f6ed',fontSize:29,fontWeight:'700',letterSpacing:-.7,lineHeight:34,marginTop:13,maxWidth:620},
 body:{color:'#c0d7d1',fontSize:15,lineHeight:23,marginTop:13,maxWidth:650},
 actions:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:22},primary:{backgroundColor:'#b9e6c8',paddingHorizontal:19,paddingVertical:15,borderRadius:24},primaryText:{color:'#102f36',fontWeight:'800',fontSize:14},secondary:{paddingHorizontal:12,paddingVertical:15},secondaryText:{color:'#d6eade',fontWeight:'700',fontSize:13},
 note:{color:'#99b9b1',fontSize:11,lineHeight:17,marginTop:16},explore:{marginTop:18,paddingVertical:12,borderTopWidth:1,borderTopColor:'#ffffff25'},projects:{flexDirection:'row',flexWrap:'wrap',gap:10},project:{padding:15,borderWidth:1,borderColor:'#ffffff25',borderRadius:13,flexGrow:1,flexBasis:220},projectTitle:{color:'#f0f6ed',fontWeight:'700',fontSize:14},projectText:{color:'#abc9c0',fontSize:12,lineHeight:18,marginTop:6},error:{color:'#ffd4be',marginTop:12,fontSize:13}
});
