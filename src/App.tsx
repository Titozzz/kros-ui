import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type SpellModel, spells } from "./lib/spells";
import "./index.css";

export function App() {
  const [currentSpell, setCurrentSpell] = useState<SpellModel | null>(null);

  const getRandomSpell = useCallback(() => {
    if (spells.length === 0) return;
    const randomIndex = Math.floor(Math.random() * spells.length);
    const spell = spells[randomIndex];
    if (spell) {
      setCurrentSpell(spell);
    }
  }, []);

  useEffect(() => {
    getRandomSpell();
  }, [getRandomSpell]);

  if (!currentSpell) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p>Loading spells...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 flex flex-col items-center min-h-screen gap-8">
      <h1 className="text-4xl font-bold text-primary">Dofus Spell Guesser</h1>

      <div className="p-4 bg-accent/10 rounded-xl shadow-lg">
        <img
          src={`/spell_images/sort_${currentSpell.iconId}.png`}
          alt={currentSpell.name}
          className="w-32 h-32 object-contain"
          onError={(e) => {
            // Fallback if image is missing
            (e.target as HTMLImageElement).src =
              "https://placehold.co/128x128?text=No+Image";
          }}
        />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{currentSpell.name}</CardTitle>
          <CardDescription className="text-lg font-medium">
            {currentSpell.class} •{" "}
            {currentSpell.element.length > 0
              ? currentSpell.element.join(" / ")
              : "Aucun"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground flex justify-between px-4">
            <span>Level: {currentSpell.unlockLevel}</span>
            <span>{currentSpell.isVariant ? "Variant" : "Base Spell"}</span>
          </div>
          <p className="text-center italic">"{currentSpell.description}"</p>
        </CardContent>
      </Card>

      <Button onClick={getRandomSpell} size="lg">
        Next Spell
      </Button>
    </div>
  );
}

export default App;
