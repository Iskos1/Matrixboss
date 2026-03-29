"use client";

interface SocialTabProps {
  portfolioData: any;
  onChange: (data: any) => void;
}

export default function SocialTab({ portfolioData, onChange }: SocialTabProps) {
  const links: any[] = portfolioData.socialLinks || [];

  const updateLink = (index: number, field: string, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    onChange({ ...portfolioData, socialLinks: newLinks });
  };

  const addLink = () => {
    onChange({
      ...portfolioData,
      socialLinks: [...links, { id: links.length + 1, label: "New Link", url: "https://", icon: "globe" }],
    });
  };

  const deleteLink = (index: number) => {
    onChange({ ...portfolioData, socialLinks: links.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 overflow-hidden admin-card">
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-4 md:px-6 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 bg-cyan-100 rounded-lg flex items-center justify-center text-sm">🔗</span>
              Social Links &amp; Contact
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Professional social media and contact links</p>
          </div>
          <button onClick={addLink} className="flex-shrink-0 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:from-cyan-700 hover:to-blue-700 transition shadow-lg flex items-center gap-1.5 text-sm">
            <span>+</span> Add Link
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden admin-card">
        <div className="p-4 md:p-5">
          {links.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-400 text-sm mb-2">No social links added yet</p>
              <button onClick={addLink} className="text-sm text-cyan-600 hover:text-cyan-700 font-semibold">+ Add your first link</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {links.map((link, index) => (
                <div key={index} className="p-4 border-2 border-slate-100 rounded-xl hover:border-cyan-200 hover:bg-cyan-50/20 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <select
                      value={link.icon}
                      onChange={(e) => updateLink(index, "icon", e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 font-semibold bg-white text-base"
                    >
                      <option value="github">🐙 GitHub</option>
                      <option value="linkedin">💼 LinkedIn</option>
                      <option value="twitter">🐦 Twitter</option>
                      <option value="globe">🌐 Website</option>
                      <option value="mail">✉️ Email</option>
                    </select>
                    <button onClick={() => deleteLink(index)} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition border border-red-200 flex-shrink-0" title="Delete link">✕</button>
                  </div>
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateLink(index, "label", e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 mb-2 text-base"
                    placeholder="Display Label"
                  />
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => updateLink(index, "url", e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
                    placeholder="https://..."
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg p-5 md:p-6 text-white admin-card">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2"><span>👁️</span> Live Preview</h3>
        <div className="flex flex-wrap gap-2">
          {links.map((link, idx) => (
            <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all text-sm font-semibold backdrop-blur-sm">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
