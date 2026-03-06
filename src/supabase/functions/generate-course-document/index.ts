
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "https://esm.sh/docx@8.5.0";

// Interfaces for course data structure
interface MicroModule {
  title: string;
  content: string;
  learning_objective: string;
  estimated_duration_minutes?: number;
  quick_quiz?: {
    question: string;
    options: string[];
    correct: number; // 0-based index
    explanation: string;
  };
}

interface Subtopic {
  title: string;
  description?: string;
  micro_modules: MicroModule[];
  estimatedDuration?: string;
}

interface Topic {
  title:string;
  description?: string;
  subtopics: Subtopic[];
  estimatedDuration?: string;
}

interface CourseData {
  title: string;
  description: string | null;
  skill_area: string | null;
  difficulty_level: string | null;
  estimated_duration: string | null;
  topics: Topic[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper class for PDF generation
class PdfGenerator {
  doc: jsPDF;
  y: number;
  pageWidth: number;
  pageHeight: number;
  margin: number;

  constructor() {
    this.doc = new jsPDF();
    this.y = 20;
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
  }

  checkPageBreak(heightNeeded: number) {
    if (this.y + heightNeeded > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.y = this.margin;
    }
  }

  addText(text: string, size: number, isBold = false) {
    this.doc.setFontSize(size);
    this.doc.setFont(undefined, isBold ? 'bold' : 'normal');
    const lines = this.doc.splitTextToSize(text, this.pageWidth - this.margin * 2);
    this.checkPageBreak(lines.length * (size / 2)); // Approximate height needed
    for (const line of lines) {
        this.doc.text(line, this.margin, this.y);
        this.y += (size / 2);
    }
    this.y += 5;
  }
  
  addCenteredText(text: string, size: number, isBold = true) {
    this.doc.setFontSize(size);
    this.doc.setFont(undefined, isBold ? 'bold' : 'normal');
    const textWidth = this.doc.getTextWidth(text);
    const textX = (this.pageWidth - textWidth) / 2;
    this.doc.text(text, textX, this.y);
    this.y += (size / 2) + 5;
  }

  generate(courseData: CourseData) {
    // Title Page
    this.y = this.pageHeight / 4;
    this.addCenteredText(courseData.title, 24);
    if(courseData.description) this.addCenteredText(courseData.description, 14, false);
    this.y += 10;
    if(courseData.skill_area) this.addCenteredText(`Skill Area: ${courseData.skill_area}`, 12, false);
    if(courseData.difficulty_level) this.addCenteredText(`Difficulty: ${courseData.difficulty_level}`, 12, false);
    if(courseData.estimated_duration) this.addCenteredText(`Duration: ${courseData.estimated_duration}`, 12, false);

    this.doc.addPage();
    this.y = this.margin;

    // Content
    (courseData.topics || []).forEach((topic) => {
      this.addText(topic.title, 18, true);
      if (topic.description) this.addText(topic.description, 11);

      (topic.subtopics || []).forEach((subtopic) => {
        this.addText(subtopic.title, 16, true);
        if (subtopic.description) this.addText(subtopic.description, 11);

        (subtopic.micro_modules || []).forEach((module) => {
          this.addText(module.title, 14, true);
          this.addText(`Learning Objective: ${module.learning_objective}`, 11);
          if (module.estimated_duration_minutes) this.addText(`Duration: ${module.estimated_duration_minutes} mins`, 11);
          this.addText("Content:", 11, true);
          this.addText(module.content, 11);

          if (module.quick_quiz) {
            this.addText("Quiz:", 12, true);
            this.addText(module.quick_quiz.question, 11);
            module.quick_quiz.options.forEach((opt, i) => {
              const isCorrect = i === module.quick_quiz?.correct;
              this.addText(`- ${opt} ${isCorrect ? '(Correct)' : ''}`, 11);
            });
            if(module.quick_quiz.explanation) this.addText(`Explanation: ${module.quick_quiz.explanation}`, 11);
          }
        });
      });
    });

    return this.doc.output('blob');
  }
}

// Main serve function
serve(async (req: Request) => {
  console.log("generate-course-document function invoked.");
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS preflight request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Parsing request body...");
    const { courseId, format } = await req.json();
    console.log(`Request received for courseId: ${courseId}, format: ${format}`);

    if (!courseId || !format || !['pdf', 'docx'].includes(format)) {
      console.error("Validation failed: Missing or invalid courseId or format.");
      return new Response(JSON.stringify({ error: "Missing or invalid courseId or format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Creating Supabase admin client...");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`Fetching course data for courseId: ${courseId}`);
    const { data: course, error } = await supabaseAdmin
      .from("courses")
      .select("title, description, skill_area, difficulty_level, estimated_duration, topics")
      .eq("id", courseId)
      .single();

    if (error) {
        console.error("Supabase error fetching course:", error);
        throw error;
    }

    if (!course) {
      console.error(`Course not found for courseId: ${courseId}`);
      return new Response(JSON.stringify({ error: "Course not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log("Successfully fetched course data.");

    const courseData = course as CourseData;
    const safeTitle = (courseData.title || 'course').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeTitle}.${format}`;
    
    let fileBlob: Blob;
    let contentType: string;

    if (format === 'pdf') {
      try {
        console.log("Starting PDF generation...");
        const pdfGenerator = new PdfGenerator();
        fileBlob = pdfGenerator.generate(courseData);
        contentType = 'application/pdf';
        console.log("PDF generation successful.");
      } catch(pdfError: unknown) {
        console.error("Error during PDF generation:", pdfError);
        const errorMessage = pdfError instanceof Error ? pdfError.message : String(pdfError);
        throw new Error(`PDF generation failed: ${errorMessage}`);
      }
    } else { // format === 'docx'
      try {
        console.log("Starting DOCX generation...");
        const children: Paragraph[] = [];
      
        // Title page
        children.push(new Paragraph({ text: courseData.title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }));
        if(courseData.description) children.push(new Paragraph({ text: courseData.description, alignment: AlignmentType.CENTER }));
        children.push(new Paragraph({ text: "" })); // Spacer

        // Content
        (courseData.topics || []).forEach((topic) => {
          children.push(new Paragraph({ text: topic.title, heading: HeadingLevel.HEADING_1 }));
          if(topic.description) children.push(new Paragraph({ text: topic.description, style: "IntenseQuote" }));
          
          (topic.subtopics || []).forEach((subtopic) => {
            children.push(new Paragraph({ text: subtopic.title, heading: HeadingLevel.HEADING_2 }));
            if(subtopic.description) children.push(new Paragraph(subtopic.description));

            (subtopic.micro_modules || []).forEach((module) => {
              children.push(new Paragraph({ text: module.title, heading: HeadingLevel.HEADING_3 }));
              children.push(new Paragraph({ children: [new TextRun({ text: "Learning Objective: ", bold: true }), new TextRun(module.learning_objective)] }));
              (module.content || "").split('\n').forEach(line => children.push(new Paragraph(line)));

              if(module.quick_quiz) {
                children.push(new Paragraph({ text: "Quiz", heading: HeadingLevel.HEADING_4 }));
                children.push(new Paragraph({ children: [new TextRun({ text: "Question: ", bold: true }), new TextRun(module.quick_quiz.question)] }));
                module.quick_quiz.options.forEach((opt, i) => {
                  const isCorrect = i === module.quick_quiz?.correct;
                  children.push(new Paragraph({ text: `- ${opt} ${isCorrect ? '(Correct)' : ''}`, bullet: { level: 0 }}));
                });
                if(module.quick_quiz.explanation) children.push(new Paragraph({ children: [new TextRun({ text: "Explanation: ", bold: true }), new TextRun(module.quick_quiz.explanation)]}));
              }
               children.push(new Paragraph({ text: "" })); // Spacer
            });
          });
        });

        const doc = new Document({ sections: [{ children }] });
        fileBlob = await Packer.toBlob(doc);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        console.log("DOCX generation successful.");
      } catch (docxError: unknown) {
        console.error("Error during DOCX generation:", docxError);
        const errorMessage = docxError instanceof Error ? docxError.message : String(docxError);
        throw new Error(`DOCX generation failed: ${errorMessage}`);
      }
    }
    
    console.log(`Returning file: ${filename}, Content-Type: ${contentType}`);
    return new Response(fileBlob, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (err) {
    console.error("Unhandled error in generate-course-document function:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message || "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
