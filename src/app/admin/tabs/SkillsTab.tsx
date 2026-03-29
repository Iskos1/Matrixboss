"use client";

interface SkillsTabProps {
  portfolioData: any;
  onChange: (data: any) => void;
}

export default function SkillsTab({ portfolioData, onChange }: SkillsTabProps) {
  const updateSkill = (index: number, field: string, value: string) => {
    const newSkills = [...portfolioData.skills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    onChange({ ...portfolioData, skills: newSkills });
  };

  const addSkill = () => {
    onChange({
      ...portfolioData,
      skills: [...portfolioData.skills, { id: portfolioData.skills.length + 1, name: "New Skill", category: "technical" }],
    });
  };

  const deleteSkill = (index: number) => {
    onChange({ ...portfolioData, skills: portfolioData.skills.filter((_: any, i: number) => i !== index) });
  };

  const CATEGORIES = [
    { id: "technical", bg: "bg-purple-50", border: "border-purple-100", icon: "💻", label: "Technical Skills" },
    { id: "business",  bg: "bg-green-50",  border: "border-green-100",  icon: "📊", label: "Business Skills" },
    { id: "tools",     bg: "bg-orange-50", border: "border-orange-100", icon: "🛠️", label: "Tools & Platforms" },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden admin-card">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-4 md:px-6 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-sm">🎯</span>
              Skills &amp; Expertise
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Technical, business, and tool proficiencies</p>
          </div>
          <button onClick={addSkill} className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2.5 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition shadow-lg flex items-center gap-1.5 text-sm">
            <span>+</span> Add Skill
          </button>
        </div>
      </div>

      {CATEGORIES.map(({ id, bg, border, icon, label }) => {
        const categorySkills = portfolioData.skills.filter((s: any) => s.category === id);
        return (
          <div key={id} className={`bg-white rounded-2xl shadow-sm border ${border} overflow-hidden admin-card`}>
            <div className={`${bg} px-4 md:px-6 py-3.5 border-b ${border} flex items-center gap-2`}>
              <span className="text-base">{icon}</span>
              <h3 className="text-base font-bold text-slate-900">{label}</h3>
              <span className="text-xs font-normal text-slate-400 ml-1">({categorySkills.length})</span>
            </div>
            <div className="p-4 md:p-5">
              {categorySkills.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-slate-400 text-sm">No {id} skills yet</p>
                  <button onClick={addSkill} className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-semibold">+ Add {id} skill</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {categorySkills.map((skill: any) => {
                    const index = portfolioData.skills.indexOf(skill);
                    return (
                      <div key={index} className="flex gap-2 items-center p-3 border-2 border-slate-100 rounded-xl hover:border-purple-200 hover:bg-purple-50/20 transition-all">
                        <input
                          type="text"
                          value={skill.name}
                          onChange={(e) => updateSkill(index, "name", e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-400 text-base bg-white min-w-0"
                          placeholder="Skill name"
                        />
                        <select
                          value={skill.category}
                          onChange={(e) => updateSkill(index, "category", e.target.value)}
                          className="px-2 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-400 text-xs bg-white"
                        >
                          <option value="technical">Technical</option>
                          <option value="business">Business</option>
                          <option value="tools">Tools</option>
                        </select>
                        <button onClick={() => deleteSkill(index)} className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition border border-red-200 flex-shrink-0" title="Delete">✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
