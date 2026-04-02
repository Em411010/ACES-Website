import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, CalendarDays, Trash2 } from "lucide-react";
import { documentsApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";
import type { DocumentItem, Role } from "@/types";

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [showUploadCard, setShowUploadCard] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const docxInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    title: "",
    pdfFile: null as File | null,
    docxFile: null as File | null,
  });

  const role = typeof user?.roleId === "object" ? (user.roleId as Role) : null;
  const canManageDocuments = !!role?.permissions?.includes("MANAGE_DOCUMENTS");

  useEffect(() => {
    documentsApi.getAll().then(setDocuments).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDocId && documents.length > 0) {
      setSelectedDocId(documents[0]._id);
      return;
    }

    if (selectedDocId && !documents.some((d) => d._id === selectedDocId)) {
      setSelectedDocId(documents[0]?._id || null);
    }
  }, [documents, selectedDocId]);

  const selectedDoc = documents.find((d) => d._id === selectedDocId) || null;

  const uploadsBase = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : "")).replace(/\/api\/?$/, "");
  const selectedPdfUrlRaw = selectedDoc?.pdfUrl || selectedDoc?.fileUrl;
  const selectedPdfUrl = selectedPdfUrlRaw
    ? /^https?:\/\//i.test(selectedPdfUrlRaw)
      ? selectedPdfUrlRaw
      : `${uploadsBase}${selectedPdfUrlRaw}`
    : null;

  const selectedUploader =
    selectedDoc && typeof selectedDoc.uploadedBy === "object" ? selectedDoc.uploadedBy : null;
  const selectedUploaderRole =
    selectedUploader && typeof selectedUploader.roleId === "object"
      ? (selectedUploader.roleId as Role).name
      : null;

  async function handleUpload() {
    if (!canManageDocuments) return;
    if (!form.pdfFile || !form.docxFile) {
      window.alert("Please choose both PDF and DOCX files.");
      return;
    }

    if (!form.pdfFile.name.toLowerCase().endsWith(".pdf")) {
      window.alert("PDF file must be a .pdf file.");
      return;
    }

    if (!form.docxFile.name.toLowerCase().endsWith(".docx")) {
      window.alert("DOCX file must be a .docx file.");
      return;
    }

    const body = new FormData();
    body.append("pdfFile", form.pdfFile);
    body.append("docxFile", form.docxFile);
    body.append("title", form.title.trim());

    try {
      setUploading(true);
      await documentsApi.upload(body);
      const updated = await documentsApi.getAll();
      setDocuments(updated);
      setShowUploadCard(false);
      setForm({ title: "", pdfFile: null, docxFile: null });
      if (pdfInputRef.current) pdfInputRef.current.value = "";
      if (docxInputRef.current) docxInputRef.current.value = "";
    } catch {
      window.alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(doc: DocumentItem, variant: "pdf" | "docx" = "pdf") {
    try {
      const response = await documentsApi.download(doc._id, variant);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download =
        variant === "docx"
          ? (doc.docxFileName || doc.fileName || "document.docx")
          : (doc.pdfFileName || doc.fileName || "document.pdf");
      window.document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      window.alert("Download failed.");
    }
  }

  async function handleDelete(id: string) {
    if (!canManageDocuments) return;
    const ok = window.confirm("Delete this document?");
    if (!ok) return;

    try {
      setDeletingId(id);
      await documentsApi.remove(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch {
      window.alert("Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{documents.length} documents</p>
        {canManageDocuments && (
          <button
            onClick={() => setShowUploadCard(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Upload Document
          </button>
        )}
      </div>

      {showUploadCard && canManageDocuments && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button
            aria-label="Close upload dialog"
            onClick={() => {
              setShowUploadCard(false);
              setForm({ title: "", pdfFile: null, docxFile: null });
              if (pdfInputRef.current) pdfInputRef.current.value = "";
              if (docxInputRef.current) docxInputRef.current.value = "";
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />
          <Card className="relative z-50 w-full max-w-xl border-cyan/30 shadow-2xl">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-base font-semibold">Upload Document</h3>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Title (optional)</label>
                <input
                  type="text"
                  aria-label="Document title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">PDF File</label>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  aria-label="Choose PDF file"
                  onChange={(e) => setForm((prev) => ({ ...prev, pdfFile: e.target.files?.[0] || null }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">DOCX File</label>
                <input
                  ref={docxInputRef}
                  type="file"
                  accept=".docx"
                  aria-label="Choose DOCX file"
                  onChange={(e) => setForm((prev) => ({ ...prev, docxFile: e.target.files?.[0] || null }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowUploadCard(false);
                    setForm({ title: "", pdfFile: null, docxFile: null });
                    if (pdfInputRef.current) pdfInputRef.current.value = "";
                    if (docxInputRef.current) docxInputRef.current.value = "";
                  }}
                  className="px-3 py-2 rounded-md border border-input text-sm hover:bg-accent/40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 space-y-2">
        {documents.map((doc) => {
          return (
          <Card
            key={doc._id}
            onClick={() => setSelectedDocId(doc._id)}
            className={`transition-colors group cursor-pointer ${
              selectedDocId === doc._id
                ? "border-gold/50 bg-gold/5"
                : "hover:border-cyan/30"
            }`}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive shrink-0">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold truncate group-hover:text-cyan transition-colors">
                  {doc.title}
                </h4>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px]">PDF + DOCX</Badge>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline">PDF {doc.pdfFileSize || doc.fileSize || "-"}</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline">DOCX {doc.docxFileSize || "-"}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <CalendarDays size={10} />
                    {new Date(doc.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  void handleDownload(doc, "pdf");
                }}
                aria-label={`Download PDF ${doc.title}`}
                title={`Download PDF ${doc.title}`}
                className="p-2 rounded-lg text-muted-foreground hover:text-cyan hover:bg-cyan/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <Download size={18} />
              </button>
              {canManageDocuments && (
                <button
                  onClick={() => {
                    void handleDelete(doc._id);
                  }}
                  disabled={deletingId === doc._id}
                  aria-label={`Delete ${doc.title}`}
                  title={`Delete ${doc.title}`}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </CardContent>
          </Card>
          );
        })}
        </div>

        <div className="lg:col-span-5">
          <Card className="lg:sticky lg:top-20">
            <CardContent className="p-4 space-y-3">
              {!selectedDoc ? (
                <div className="text-sm text-muted-foreground py-10 text-center">
                  Select a document to preview details.
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-base font-semibold truncate">{selectedDoc.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF {selectedDoc.pdfFileSize || selectedDoc.fileSize || "-"} • DOCX {selectedDoc.docxFileSize || "-"} • {new Date(selectedDoc.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Uploaded by: {selectedUploader?.fullName || "Unknown"}
                      {selectedUploaderRole ? ` (${selectedUploaderRole})` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        void handleDownload(selectedDoc, "pdf");
                      }}
                      className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={() => {
                        void handleDownload(selectedDoc, "docx");
                      }}
                      className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold hover:bg-accent/40"
                    >
                      Download DOCX
                    </button>
                    {canManageDocuments && (
                      <button
                        onClick={() => {
                          void handleDelete(selectedDoc._id);
                        }}
                        disabled={deletingId === selectedDoc._id}
                        className="px-3 py-1.5 rounded-md border border-destructive/40 text-destructive text-xs font-semibold hover:bg-destructive/10 disabled:opacity-50"
                      >
                        {deletingId === selectedDoc._id ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-2 min-h-[320px] lg:min-h-[520px]">
                    {selectedPdfUrl ? (
                      <iframe
                        src={selectedPdfUrl}
                        title="PDF preview"
                        className="w-full h-[400px] lg:h-[620px] rounded border border-border"
                      />
                    ) : (
                      <div className="h-[520px] flex items-center justify-center text-sm text-muted-foreground text-center px-4">
                        PDF preview is not available for this document yet. Upload a PDF version to preview exact formatting.
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
