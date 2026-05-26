import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { GeneratedPaper } from '@/types';

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingHorizontal: 48,
    paddingBottom: 48,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#1A1A1A',
    lineHeight: 1.45,
  },
  schoolName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  subjectLine: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
  },
  metaText: { fontSize: 11 },
  bold: { fontFamily: 'Helvetica-Bold' },
  italic: { fontFamily: 'Helvetica-Oblique' },
  studentBlock: { marginTop: 10, marginBottom: 8 },
  studentLine: { marginBottom: 4 },

  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginTop: 22,
    marginBottom: 12,
  },
  sectionType: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  sectionInstruction: {
    fontFamily: 'Helvetica-Oblique',
    marginBottom: 12,
    color: '#374151',
  },
  questionRow: {
    flexDirection: 'row',
    marginBottom: 7,
    paddingRight: 4,
  },
  questionNum: { width: 18 },
  questionText: { flex: 1 },

  endLine: {
    fontFamily: 'Helvetica-Bold',
    marginTop: 14,
    marginBottom: 4,
  },

  answerHeading: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginTop: 24,
    marginBottom: 10,
  },
  answerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  answerNum: { width: 18 },
  answerText: { flex: 1 },
});

function difficultyLabel(d: string): string {
  const map: Record<string, string> = {
    easy: 'Easy',
    moderate: 'Moderate',
    hard: 'Hard',
    challenging: 'Challenging',
  };
  return map[d] ?? d;
}

export default function PaperPdf({ paper }: { paper: GeneratedPaper }): JSX.Element {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.schoolName}>{paper.schoolName}</Text>
        <Text style={styles.subjectLine}>Subject: {paper.subject}</Text>
        <Text style={styles.subjectLine}>Class: {paper.className}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            <Text style={styles.bold}>Time Allowed:</Text> {paper.timeAllowed} minutes
          </Text>
          <Text style={styles.metaText}>
            <Text style={styles.bold}>Maximum Marks:</Text> {paper.totalMarks}
          </Text>
        </View>

        <Text style={styles.bold}>All questions are compulsory unless stated otherwise.</Text>

        <View style={styles.studentBlock}>
          <Text style={styles.studentLine}>Name: ____________________</Text>
          <Text style={styles.studentLine}>Roll Number: _______________</Text>
          <Text style={styles.studentLine}>
            Class: {paper.className} Section: ________
          </Text>
        </View>

        {paper.sections.map((s, si) => (
          <View key={si}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionType}>{s.questionType}</Text>
            <Text style={styles.sectionInstruction}>{s.instruction}</Text>
            {s.questions.map((q) => (
              <View key={q.number} style={styles.questionRow} wrap={false}>
                <Text style={styles.questionNum}>{q.number}.</Text>
                <Text style={styles.questionText}>
                  [{difficultyLabel(q.difficulty)}] {q.text} [{q.marks} Marks]
                </Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.endLine}>End of Question Paper</Text>

        <Text style={styles.answerHeading}>Answer Key:</Text>
        {paper.answerKey.map((a) => (
          <View key={a.number} style={styles.answerRow}>
            <Text style={styles.answerNum}>{a.number}.</Text>
            <Text style={styles.answerText}>{a.answer}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
