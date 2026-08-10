
import { GoogleGenAI } from "@google/genai";
import { MaintenanceRecord } from "../types";

export const getMaintenanceAdvice = async (records: MaintenanceRecord[]) => {
  if (records.length === 0) return "Ajoutez des données pour obtenir des conseils.";
  
  const ai = new GoogleGenAI({ 
    apiKey: process.env.API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const prompt = `
    Agis en tant qu'expert en maintenance de groupes électrogènes Brel Energie. 
    Voici la liste actuelle de ma flotte de générateurs :
    ${JSON.stringify(records.map(r => ({
      Client: r.customerName,
      Site: r.site,
      Modele: r.model,
      HeuresActuelles: r.currentIndex,
      HeuresVidangeProchaine: r.nextChangeIndex,
      HeuresCourroieProchaine: r.nextBeltChangeIndex,
      HeuresParJour: r.dailyHours,
      Filtres: {
        Huile: r.oilFilterRef,
        Gasoil: r.fuelFilterRef,
        Air: r.airFilterRef
      }
    })))}
    
    Analyse ces données et donne-moi :
    1. **Urgences Immédiates** : Quelles machines doivent être vidangées ou voir leur courroie changée dans les 48h.
    2. **Planification Logistique** : Conseils sur les pièces à commander en priorité (filtres, huile) basé sur les modèles.
    3. **Optimisation du Régime** : Analyse du nombre d'heures par jour. Si un groupe tourne trop (ex: > 18h/j), suggère des mesures.
    4. **Conseils Spécifiques par Modèle** : Si tu connais des faiblesses ou points de vigilance sur ces modèles (Perkins, Cummins, etc.), mentionne-les.
    
    Réponds de manière structurée, professionnelle et en français. Utilise du Markdown avec des icônes pertinentes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });
    return response.text || "Impossible de générer des conseils pour le moment.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erreur lors de la connexion à l'IA.";
  }
};
