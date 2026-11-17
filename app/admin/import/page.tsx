"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Header from "@/components/layout/Header";
import { parseTakeoutFile, type ImportRow } from "@/lib/google/takeout-parser";
import { importRows, type ImportResult } from "./actions";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);

    const incoming: ImportRow[] = [];
    const names: string[] = [];
    let remaining = acceptedFiles.length;

    for (const file of acceptedFiles) {
      names.push(file.name);
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const text = reader.result as string;
          const parsed = parseTakeoutFile(text, file.name);
          incoming.push(...parsed);
        } catch (err) {
          setError(
            `Failed to parse ${file.name}: ${err instanceof Error ? err.message : String(err)}`
          );
        } finally {
          remaining--;
          if (remaining === 0) {
            setRows((prev) => [...prev, ...incoming]);
            setFileNames((prev) => [...prev, ...names]);
          }
        }
      };

      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
      "text/csv": [".csv"],
    },
  });

  function getName(row: ImportRow): string {
    if (row.source === "saved-list") return row.wantToGo.name;
    return row.cafe.name;
  }

  function getAddress(row: ImportRow): string {
    if (row.source === "saved-list") return row.wantToGo.address || "—";
    return row.cafe.address || "—";
  }

  function getRating(row: ImportRow): string {
    if (row.source === "reviews") return `${row.review.overall_rating} sips`;
    return "—";
  }

  function getSourceLabel(row: ImportRow): string {
    switch (row.source) {
      case "reviews":
        return "Review";
      case "starred":
        return "Starred";
      case "saved-list":
        return "Saved List";
    }
  }

  async function handleImportAll() {
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importRows(rows);
      setImportResult(result);
      if (result.errors.length === 0) {
        setRows([]);
        setFileNames([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function handleClear() {
    setRows([]);
    setFileNames([]);
    setError(null);
  }

  return (
    <>
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-heading text-3xl font-bold text-espresso">
          Import from Google Takeout
        </h1>
        <p className="mt-2 font-heading text-lg text-espresso-muted">
          Drop your exported files here — Reviews.json, Saved Places.json, or a
          saved-list CSV.
        </p>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`hand-drawn-border mt-8 flex cursor-pointer flex-col items-center justify-center gap-3 px-8 py-16 text-center transition-colors ${
            isDragActive ? "bg-sage/15" : "bg-cream hover:bg-sage/5"
          }`}
        >
          <input {...getInputProps()} />

          <UploadIcon className="h-12 w-12 text-espresso/40" />

          {isDragActive ? (
            <p className="font-heading text-xl text-sage-dark">
              Drop it like it&apos;s hot...
            </p>
          ) : (
            <p className="font-heading text-xl text-espresso-muted">
              Drag &amp; drop .json or .csv files here, or click to browse
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="hand-drawn-border mt-4 bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
            {error}
          </div>
        )}

        {/* Loaded files */}
        {fileNames.length > 0 && (
          <p className="mt-4 text-sm text-espresso-muted">
            Loaded:{" "}
            <span className="font-medium text-espresso">
              {fileNames.join(", ")}
            </span>
          </p>
        )}

        {/* Preview table */}
        {rows.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold text-espresso">
                Preview ({rows.length} items)
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={handleClear}
                  className="hand-drawn-border px-4 py-2 font-heading text-base text-espresso transition-colors hover:bg-espresso/5"
                >
                  Clear
                </button>
                <button
                  onClick={handleImportAll}
                  disabled={importing}
                  className="hand-drawn-border bg-terracotta px-5 py-2 font-heading text-base text-cream transition-colors hover:bg-terracotta-dark disabled:opacity-50"
                >
                  {importing ? "Importing..." : "Import All"}
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-espresso/20">
                    <th className="pb-2 pr-4 font-heading text-base text-espresso-muted">
                      Name
                    </th>
                    <th className="pb-2 pr-4 font-heading text-base text-espresso-muted">
                      Address
                    </th>
                    <th className="pb-2 pr-4 font-heading text-base text-espresso-muted">
                      Rating
                    </th>
                    <th className="pb-2 font-heading text-base text-espresso-muted">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-espresso/10 transition-colors hover:bg-sage/5"
                    >
                      <td className="py-2 pr-4 font-medium text-espresso">
                        {getName(row)}
                      </td>
                      <td className="py-2 pr-4 text-espresso-muted">
                        {getAddress(row)}
                      </td>
                      <td className="py-2 pr-4 text-espresso-muted">
                        {getRating(row)}
                      </td>
                      <td className="py-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.source === "reviews"
                              ? "bg-terracotta/15 text-terracotta"
                              : row.source === "starred"
                                ? "bg-sage/20 text-sage-dark"
                                : "bg-blue/15 text-blue"
                          }`}
                        >
                          {getSourceLabel(row)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Import result */}
        {importResult && (
          <section className="mt-8 hand-drawn-border bg-cream p-5">
            <h2 className="font-heading text-xl font-semibold text-espresso">
              Import Complete
            </h2>
            <div className="mt-3 space-y-1 font-heading text-base">
              <p className="text-sage-dark">{importResult.cafesCreated} cafes created</p>
              {importResult.cafesSkipped > 0 && (
                <p className="text-espresso-muted">{importResult.cafesSkipped} cafes already existed</p>
              )}
              <p className="text-sage-dark">{importResult.reviewsCreated} reviews imported</p>
              <p className="text-sage-dark">{importResult.wantToGoCreated} want-to-go items added</p>
              {importResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="font-heading text-sm font-semibold text-terracotta">
                    {importResult.errors.length} errors:
                  </p>
                  <ul className="mt-1 list-inside list-disc text-sm text-terracotta">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 32V14M24 14L17 21M24 14L31 21"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 34C8 38 11 40 15 40H33C37 40 40 38 40 34"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
