"use client";

interface CertificationsTabProps {
  portfolioData: any;
  onChange: (data: any) => void;
}

export default function CertificationsTab({ portfolioData, onChange }: CertificationsTabProps) {
  const certs: any[] = portfolioData.certifications || [];

  const addCert = () => {
    onChange({
      ...portfolioData,
      certifications: [...certs, { id: Date.now(), name: "", issuer: "", year: new Date().getFullYear().toString() }],
    });
  };

  const updateCert = (idx: number, field: string, value: string) => {
    const updated = [...certs];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange({ ...portfolioData, certifications: updated });
  };

  const deleteCert = (idx: number) => {
    onChange({ ...portfolioData, certifications: certs.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 overflow-hidden admin-card">
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-4 md:px-6 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 bg-yellow-100 rounded-lg flex items-center justify-center text-sm">🏅</span>
              Certifications
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Used by Resume AI when tailoring your resume</p>
          </div>
          <button onClick={addCert} className="flex-shrink-0 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-2.5 rounded-xl font-bold hover:from-yellow-600 hover:to-amber-600 transition shadow-lg flex items-center gap-1.5 text-sm">
            <span>+</span> Add Cert
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden admin-card">
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50/50 px-4 md:px-6 py-3.5 border-b border-slate-200 flex items-center gap-2">
          <span>🏅</span>
          <h3 className="text-base font-bold text-slate-900">Your Certifications</h3>
          <span className="text-xs font-normal text-slate-400">({certs.length})</span>
        </div>
        <div className="p-4 md:p-5">
          {certs.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-yellow-200 rounded-xl">
              <p className="text-slate-400">No certifications added yet</p>
              <p className="text-slate-300 text-sm mt-1">Click &quot;Add Cert&quot; to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {certs.map((cert, certIdx) => (
                <div key={cert.id ?? certIdx} className="p-4 border-2 border-slate-100 rounded-xl hover:border-yellow-200 hover:bg-yellow-50/20 transition-all">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) => updateCert(certIdx, "name", e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white text-base font-medium min-w-0"
                      placeholder="Certification name"
                    />
                    <button
                      onClick={() => deleteCert(certIdx)}
                      className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition border border-red-200 flex-shrink-0"
                      title="Delete"
                    >✕</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => updateCert(certIdx, "issuer", e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-400 bg-white text-base"
                        placeholder="Issuer (e.g. AWS)"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={cert.year}
                        onChange={(e) => updateCert(certIdx, "year", e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-400 bg-white text-base text-center"
                        placeholder="Year"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
