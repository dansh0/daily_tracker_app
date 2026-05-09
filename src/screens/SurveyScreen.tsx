import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SurveyShell } from '../components/survey/SurveyShell'
import { COLORS } from '../constants/theme'

export default function SurveyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <SurveyShell />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
})
