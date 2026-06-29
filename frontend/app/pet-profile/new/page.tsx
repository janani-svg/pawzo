"use client";

/* PAWZO Add New Pet — real photo upload, future-proof DOB (max today), breed
   autocomplete, and full validation. The submit button only appears once every
   required field is filled. Saving returns to the Dashboard. */

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AppFrame, TopBar, PrimaryButton, GhostButton, Field, T, inputStyle, IconPlus } from "../../components/pawzo-ui";
import { usePawzo, useRequireAuth, fileToDataURL } from "../../lib/store";
import { CropStep } from "../../components/crop-step";
import { Autocomplete } from "../../onboarding/page";

const SPECIES = ["Dog", "Cat", "Bird", "Rabbit", "Guinea pig", "Hamster", "Fish", "Reptile", "Tortoise", "Other"];
const BREEDS: Record<string, string[]> = {
  Dog: ["Labrador Retriever", "German Shepherd", "Golden Retriever", "Bulldog", "Beagle", "Poodle", "Shih Tzu", "Pug", "Rottweiler", "Dachshund", "Indian Pariah", "Mixed breed"],
  Cat: ["Persian", "Maine Coon", "Siamese", "Bengal", "British Shorthair", "Ragdoll", "Sphynx", "Indian Billi", "Mixed breed"],
  Bird: ["Budgerigar", "Cockatiel", "African Grey", "Lovebird", "Canary", "Macaw", "Finch"],
  Rabbit: ["Holland Lop", "Netherland Dwarf", "Lionhead", "Flemish Giant", "Mini Rex"],
  Fish: ["Goldfish", "Betta", "Guppy", "Molly", "Angelfish", "Tetra"],
  Reptile: ["Leopard Gecko", "Bearded Dragon", "Corn Snake", "Iguana", "Chameleon"],
  Tortoise: ["Hermann's", "Russian", "Greek", "Red-footed", "Indian Star", "Sulcata", "Leopard", "Red-eared Slider"],
};

export default function AddPet() {
  return (
    <Suspense fallback={null}>
      <AddPetInner />
    </Suspense>
  );
}

function AddPetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");
  const { ready } = useRequireAuth();
  const { addPet, updatePet, state } = usePawzo();
  const editing = editId ? state.pets.find((p) => p.id === editId) : null;

  const [photo, setPhoto]   = useState("");
  const [cropSrc, setCropSrc] = useState("");
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Dog");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "unknown">("male");
  const [dob, setDob] = useState("");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (editing) {
      setPhoto(editing.photo); setName(editing.name); setSpecies(editing.species);
      setBreed(editing.breed); setGender(editing.gender); setDob(editing.dob);
      setWeight(editing.weight); setNotes(editing.notes);
    } else {
      try { const t = localStorage.getItem("pawzo:lastPetType"); if (t && SPECIES.includes(t)) setSpecies(t); } catch {}
    }
  }, [editing]);

  if (!ready) return null;

  const dobValid = dob && dob <= today;
  const complete = name.trim() && species && breed.trim() && gender && dobValid && weight.trim() && Number(weight) > 0;

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setCropSrc(await fileToDataURL(f));
    e.target.value = "";
  }

  function save() {
    if (!complete) return;
    let region = "";
    try { region = localStorage.getItem("pawzo:lastRegion") ?? ""; } catch {}
    const data = { name: name.trim(), species, breed: breed.trim(), gender, dob, weight: weight.trim(), photo, notes: notes.trim(), region: editing?.region || region };
    if (editing) { updatePet(editing.id, data); router.push("/pet-profile"); }
    else { addPet(data); router.push("/dashboard"); }
  }

  const breedOptions = BREEDS[species] ?? [];

  return (
    <AppFrame>
      {cropSrc && (
        <CropStep
          photo={cropSrc}
          onCrop={(cropped) => { setPhoto(cropped); setCropSrc(""); }}
          onBack={() => setCropSrc("")}
        />
      )}
      <TopBar title={editing ? "Edit pet" : "Add new pet"} back={editing ? "/pet-profile" : "/dashboard"} />

      <div style={{ padding: "8px 20px 0" }}>
        {!editing && <p style={{ fontSize: 14, color: T.gray, margin: "0 0 20px" }}>Tell us about your lovely companion.</p>}

        {/* photo uploader */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
          <button className="pawzo-press" onClick={() => fileRef.current?.click()} style={{ width: 116, height: 116, borderRadius: 28, border: photo ? "none" : "2px dashed #D9B8EC", background: photo ? "transparent" : "var(--p-surface-2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", color: T.pink, overflow: "hidden", padding: 0 }} aria-label="Add pet photo">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Pet" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.pink, display: "flex", alignItems: "center", justifyContent: "center" }}><IconPlus color="#fff" size={22} /></div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: T.gray }}>Add photo</span>
              </>
            )}
          </button>
        </div>
        {photo && <div style={{ textAlign: "center", marginTop: -12, marginBottom: 14 }}><button onClick={() => fileRef.current?.click()} style={{ background: "none", border: "none", color: T.pink, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Change photo</button></div>}

        <Field label="Pet name *"><input style={inputStyle} placeholder="e.g. Buddy" value={name} onChange={(e) => setName(e.target.value)} /></Field>

        <Field label="Species *">
          <select style={{ ...inputStyle, fontWeight: 600 }} value={species} onChange={(e) => { setSpecies(e.target.value); setBreed(""); }}>
            {SPECIES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>

        <div style={{ marginBottom: 14 }}>
          <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: T.gray, marginBottom: 6 }}>Breed *</span>
          <Autocomplete value={breed} onChange={setBreed} options={breedOptions} placeholder={breedOptions.length ? "Start typing a breed…" : "Enter breed"} />
        </div>

        <Field label="Gender *">
          <div style={{ display: "flex", gap: 8 }}>
            {([{ k: "male", label: "Male" }, { k: "female", label: "Female" }, { k: "unknown", label: "Unknown" }] as const).map((g) => (
              <button type="button" key={g.k} onClick={() => setGender(g.k)} className="pawzo-press" style={{ flex: 1, height: 46, borderRadius: 14, cursor: "pointer", fontSize: 13.5, fontWeight: 700, border: `2px solid ${gender === g.k ? T.pink : "transparent"}`, background: gender === g.k ? T.primarySoft : "var(--p-surface-2)", color: gender === g.k ? T.pinkDeep : T.gray }}>{g.label}</button>
            ))}
          </div>
        </Field>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Field label="Date of birth *" hint={dob && !dobValid ? "" : undefined}>
              <input style={{ ...inputStyle, borderColor: dob && !dobValid ? T.danger : "var(--p-border)" }} type="date" max={today} value={dob} onChange={(e) => setDob(e.target.value)} />
              {dob && !dobValid && <span style={{ fontSize: 11, color: T.danger, marginTop: 5, display: "block" }}>Date can&apos;t be in the future.</span>}
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Weight (kg) *" hint="e.g. 12.5">
              <input style={inputStyle} type="number" step="0.1" min="0" placeholder="12.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </Field>
          </div>
        </div>

        <Field label="Special notes" hint="Optional"><input style={inputStyle} placeholder="Loves belly rubs" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <GhostButton full onClick={() => router.push(editing ? "/pet-profile" : "/dashboard")}>Cancel</GhostButton>
          {complete && <PrimaryButton full onClick={save}>{editing ? "Save changes" : "Save profile"}</PrimaryButton>}
        </div>
        {!complete && <p style={{ textAlign: "center", fontSize: 11.5, color: T.grayLight, marginTop: 12 }}>Fill all required fields (*) to continue.</p>}
      </div>
    </AppFrame>
  );
}
