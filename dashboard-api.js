import {
  supabase,
  getUser,
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  getAnalysis,
  createAnalysis,
  updateAnalysis,
  getContext,
  createContext,
  getRisks,
  createRisks,
  getEnergy,
  createEnergy,
  getDocuments,
  uploadDocument,
  deleteDocument,
  deleteDocumentFile,
  getHistory,
  addHistory,
  getVerification,
  createVerification,
  getShareLinks,
  createShareLink,
  deleteShareLink,
  getCollaborators,
  inviteCollaborator,
  updateCollaborator,
  removeCollaborator,
} from './supabase.js';

export async function getCurrentUser() {
  return await getUser();
}

export async function loadUserProperties() {
  return await getProperties();
}

export async function loadPropertyDetails(propertyId) {
  const propertyPromise = getProperty(propertyId);
  const analysisPromise = getAnalysis(propertyId);
  const contextPromise = getContext(propertyId);
  const risksPromise = getRisks(propertyId);
  const energyPromise = getEnergy(propertyId);
  const documentsPromise = getDocuments(propertyId);
  const historyPromise = getHistory(propertyId);
  const verificationPromise = getVerification(propertyId);
  const shareLinksPromise = getShareLinks(propertyId);
  const collaboratorsPromise = getCollaborators(propertyId);

  const results = await Promise.all([
    propertyPromise,
    analysisPromise,
    contextPromise,
    risksPromise,
    energyPromise,
    documentsPromise,
    historyPromise,
    verificationPromise,
    shareLinksPromise,
    collaboratorsPromise,
  ]);

  const [
    property,
    analysis,
    context,
    risks,
    energy,
    documents,
    history,
    verification,
    shareLinks,
    collaborators,
  ] = results.map(r => r.data);

  return {
    property: property.data,
    analysis: analysis.data,
    context: context.data,
    risks: risks.data,
    energy: energy.data,
    documents: documents.data,
    history: history.data,
    verification: verification.data,
    shareLinks: shareLinks.data,
    collaborators: collaborators.data,
  };
}

export async function createNewProperty(addressData, propertyType, surface, rooms, constructionYear = null) {
  const { user, error: userError } = await getUser();
  if (userError || !user) {
    return { error: 'User not found' };
  }

  const propertyData = {
    user_id: user.id,
    address: addressData,
    property_type: propertyType,
    surface: parseInt(surface),
    rooms: rooms,
    construction_year: constructionYear ? parseInt(constructionYear) : null,
    access_level: 'restricted',
  };

  return await createProperty(propertyData);
}

export async function updatePropertyData(propertyId, updates) {
  return await updateProperty(propertyId, updates);
}

export async function performAnalysis(propertyId, analysisData) {
  const existingAnalysis = await getAnalysis(propertyId);

  if (existingAnalysis.data) {
    return await updateAnalysis(propertyId, analysisData);
  } else {
    return await createAnalysis(propertyId, analysisData);
  }
}

export async function updatePropertyContext(propertyId, contextData) {
  const existingContext = await getContext(propertyId);

  if (existingContext.data) {
    return await supabase
      .from('property_context')
      .update({ ...contextData, updated_at: new Date().toISOString() })
      .eq('property_id', propertyId)
      .select()
      .single();
  } else {
    return await createContext(propertyId, contextData);
  }
}

export async function updatePropertyRisks(propertyId, risksData) {
  const existingRisks = await getRisks(propertyId);

  if (existingRisks.data) {
    return await supabase
      .from('property_risks')
      .update({ ...risksData, assessed_at: new Date().toISOString() })
      .eq('property_id', propertyId)
      .select()
      .single();
  } else {
    return await createRisks(propertyId, risksData);
  }
}

export async function updatePropertyEnergy(propertyId, energyData) {
  const existingEnergy = await getEnergy(propertyId);

  if (existingEnergy.data) {
    return await supabase
      .from('property_energy')
      .update({ ...energyData, updated_at: new Date().toISOString() })
      .eq('property_id', propertyId)
      .select()
      .single();
  } else {
    return await createEnergy(propertyId, energyData);
  }
}

export async function uploadPropertyDocument(propertyId, file, documentType) {
  return await uploadDocument(propertyId, file, documentType);
}

export async function deletePropertyDocument(documentId, filePath) {
  await deleteDocumentFile(filePath);
  return await deleteDocument(documentId);
}

export async function addPropertyHistory(propertyId, historyData) {
  return await addHistory(propertyId, historyData);
}

export async function submitVerification(propertyId, relationship, justificationMethod, document) {
  const { data: uploadData, error: uploadError } = await uploadDocument(
    propertyId,
    document,
    justificationMethod
  );

  if (uploadError) {
    return { error: uploadError };
  }

  const verificationData = {
    user_relationship: relationship,
    justification_method: justificationMethod,
    document_id: uploadData.id,
  };

  return await createVerification(propertyId, verificationData);
}

export async function generateShareLink(propertyId, accessRole, expiresInDays = 30) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  return await createShareLink(propertyId, accessRole, expiresAt.toISOString());
}

export async function deleteShareLink(linkId) {
  return await deleteShareLink(linkId);
}

export async function invitePropertyCollaborator(propertyId, email, role) {
  return await inviteCollaborator(propertyId, email, role);
}

export async function acceptCollaboration(collaboratorId) {
  return await updateCollaborator(collaboratorId, null);
}

export async function removePropertyCollaborator(collaboratorId) {
  return await removeCollaborator(collaboratorId);
}

export function generateMockAnalysis(property) {
  const baseScore = 62 + Math.random() * 30;
  const globalScore = Math.round(baseScore);

  return {
    global_score: globalScore,
    structure_score: Math.round(70 + Math.random() * 25),
    risk_score: Math.round(60 + Math.random() * 35),
    energy_score: Math.round(35 + Math.random() * 40),
    synthesis: `Bien de qualité ${globalScore > 75 ? 'très bonne' : globalScore > 60 ? 'bonne' : 'acceptable'}.
    Localisation favorable à ${property.address.city}. Potentiel de valorisation identifié.`,
    analysis_data: {
      priorities: [
        {
          urgence: 'high',
          titre: 'Amélioration énergétique',
          description: 'Modernisation du système de chauffage',
          gain: '+48000€',
        },
        {
          urgence: 'medium',
          titre: 'Rénovation salle de bain',
          description: 'Mise aux normes et modernisation',
          gain: '+18000€',
        },
        {
          urgence: 'low',
          titre: 'Peinture intérieure',
          description: 'Rafraîchissement cosmétique',
          gain: '+5000€',
        },
      ],
    },
  };
}

export function generateMockContext(property) {
  const basePricePerM2 = 4800 + Math.random() * 2000;
  const pricePerM2 = Math.round(basePricePerM2);
  const estimatedValueLow = Math.round(property.surface * pricePerM2 * 0.9);
  const estimatedValueHigh = Math.round(property.surface * pricePerM2 * 1.1);

  return {
    price_per_m2: pricePerM2,
    estimated_value_low: estimatedValueLow,
    estimated_value_high: estimatedValueHigh,
    region: 'Auvergne-Rhône-Alpes',
    market_tension: ['faible', 'moyen', 'fort'][Math.floor(Math.random() * 3)],
  };
}

export function generateMockRisks(property) {
  return {
    flood_risk: Math.random() > 0.7,
    seismic_level: ['faible', 'moyen', 'fort'][Math.floor(Math.random() * 3)],
    clay_risk: Math.random() > 0.6,
    radon_risk: Math.random() > 0.8,
    urbanization_constraints: Math.random() > 0.5 ? 'Zone protégée' : null,
  };
}

export function generateMockEnergy(property) {
  const dpeClasses = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const dpeIndex = Math.floor(Math.random() * 5) + 1;

  return {
    dpe_class: dpeClasses[dpeIndex],
    is_estimated: true,
    annual_consumption: 20000 + Math.random() * 40000,
    heating_source: ['Gaz', 'Électricité', 'Pompe à chaleur', 'Géothermie'][Math.floor(Math.random() * 4)],
  };
}
