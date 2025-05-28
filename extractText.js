import fs from "fs";
import pdfParse from "pdf-parse";
import { Document, Packer } from "docx";

export async function extractText(filePath, mimetype) {
  if (mimetype === "text/plain") {
    return fs.promises.readFile(filePath, "utf-8");
  } else if (mimetype === "application/pdf") {
    const dataBuffer = await fs.promises.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filePath.endsWith(".docx")
  ) {
    // Using 'docx' package to parse .docx (you can extend if needed)
    const buffer = await fs.promises.readFile(filePath);
    // Since docx npm package is more for generating docx, use a different method:
    // For simplicity, let's rely on a 3rd party or fallback to empty string here
    return "DOCX file text extraction not yet implemented";
  } else {
    return "";
  }
}
