import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

export async function signUp(email, password, firstName, lastName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    }
  );
  return subscription;
}

// Property functions
export async function createProperty(propertyData) {
  const { data, error } = await supabase
    .from('properties')
    .insert([propertyData])
    .select()
    .single();
  return { data, error };
}

export async function getProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function getProperty(id) {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return { data, error };
}

export async function updateProperty(id, updates) {
  const { data, error } = await supabase
    .from('properties')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

// Analysis functions
export async function createAnalysis(propertyId, analysisData) {
  const { data, error } = await supabase
    .from('property_analysis')
    .insert([{ property_id: propertyId, ...analysisData }])
    .select()
    .single();
  return { data, error };
}

export async function getAnalysis(propertyId) {
  const { data, error } = await supabase
    .from('property_analysis')
    .select('*')
    .eq('property_id', propertyId)
    .maybeSingle();
  return { data, error };
}

export async function updateAnalysis(propertyId, analysisData) {
  const { data, error } = await supabase
    .from('property_analysis')
    .update({ ...analysisData, updated_at: new Date().toISOString() })
    .eq('property_id', propertyId)
    .select()
    .single();
  return { data, error };
}

// Context functions
export async function createContext(propertyId, contextData) {
  const { data, error } = await supabase
    .from('property_context')
    .insert([{ property_id: propertyId, ...contextData }])
    .select()
    .single();
  return { data, error };
}

export async function getContext(propertyId) {
  const { data, error } = await supabase
    .from('property_context')
    .select('*')
    .eq('property_id', propertyId)
    .maybeSingle();
  return { data, error };
}

// Risks functions
export async function createRisks(propertyId, risksData) {
  const { data, error } = await supabase
    .from('property_risks')
    .insert([{ property_id: propertyId, ...risksData }])
    .select()
    .single();
  return { data, error };
}

export async function getRisks(propertyId) {
  const { data, error } = await supabase
    .from('property_risks')
    .select('*')
    .eq('property_id', propertyId)
    .maybeSingle();
  return { data, error };
}

// Energy functions
export async function createEnergy(propertyId, energyData) {
  const { data, error } = await supabase
    .from('property_energy')
    .insert([{ property_id: propertyId, ...energyData }])
    .select()
    .single();
  return { data, error };
}

export async function getEnergy(propertyId) {
  const { data, error } = await supabase
    .from('property_energy')
    .select('*')
    .eq('property_id', propertyId)
    .maybeSingle();
  return { data, error };
}

// Documents functions
export async function getDocuments(propertyId) {
  const { data, error } = await supabase
    .from('property_documents')
    .select('*')
    .eq('property_id', propertyId)
    .order('uploaded_at', { ascending: false });
  return { data, error };
}

export async function deleteDocument(documentId) {
  const { error } = await supabase
    .from('property_documents')
    .delete()
    .eq('id', documentId);
  return { error };
}

// History functions
export async function getHistory(propertyId) {
  const { data, error } = await supabase
    .from('property_history')
    .select('*')
    .eq('property_id', propertyId)
    .order('event_date', { ascending: false });
  return { data, error };
}

export async function addHistory(propertyId, historyData) {
  const { data, error } = await supabase
    .from('property_history')
    .insert([{ property_id: propertyId, ...historyData }])
    .select()
    .single();
  return { data, error };
}

// Verification functions
export async function createVerification(propertyId, verificationData) {
  const { data, error } = await supabase
    .from('property_verification')
    .insert([{ property_id: propertyId, ...verificationData }])
    .select()
    .single();
  return { data, error };
}

export async function getVerification(propertyId) {
  const { data, error } = await supabase
    .from('property_verification')
    .select('*')
    .eq('property_id', propertyId)
    .maybeSingle();
  return { data, error };
}

export async function updateVerification(propertyId, updates) {
  const { data, error } = await supabase
    .from('property_verification')
    .update(updates)
    .eq('property_id', propertyId)
    .select()
    .single();
  return { data, error };
}

// Share links functions
export async function createShareLink(propertyId, accessRole, expiresAt) {
  const accessToken = generateToken();
  const { data, error } = await supabase
    .from('share_links')
    .insert([{
      property_id: propertyId,
      access_token: accessToken,
      access_role: accessRole,
      expires_at: expiresAt,
    }])
    .select()
    .single();
  return { data, error };
}

export async function getShareLinks(propertyId) {
  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function getSharedProperty(token) {
  const { data, error } = await supabase
    .from('share_links')
    .select('*, properties(*)')
    .eq('access_token', token)
    .maybeSingle();

  if (data && (!data.expires_at || new Date(data.expires_at) > new Date())) {
    await supabase
      .from('share_links')
      .update({ accessed_count: data.accessed_count + 1 })
      .eq('id', data.id);
  }

  return { data, error };
}

export async function deleteShareLink(linkId) {
  const { error } = await supabase
    .from('share_links')
    .delete()
    .eq('id', linkId);
  return { error };
}

// Collaborators functions
export async function inviteCollaborator(propertyId, collaboratorEmail, role) {
  const { data: userData, error: userError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', collaboratorEmail)
    .maybeSingle();

  if (userError || !userData) {
    return { data: null, error: { message: 'User not found' } };
  }

  const { data, error } = await supabase
    .from('property_collaborators')
    .insert([{
      property_id: propertyId,
      collaborator_id: userData.id,
      role,
    }])
    .select()
    .single();

  return { data, error };
}

export async function getCollaborators(propertyId) {
  const { data, error } = await supabase
    .from('property_collaborators')
    .select('*, auth.users!collaborator_id(id, email)')
    .eq('property_id', propertyId);
  return { data, error };
}

export async function updateCollaborator(collaboratorId, role) {
  const { data, error } = await supabase
    .from('property_collaborators')
    .update({ role, accepted_at: new Date().toISOString() })
    .eq('id', collaboratorId)
    .select()
    .single();
  return { data, error };
}

export async function removeCollaborator(collaboratorId) {
  const { error } = await supabase
    .from('property_collaborators')
    .delete()
    .eq('id', collaboratorId);
  return { error };
}

// Storage functions
export async function uploadDocument(propertyId, file, documentType) {
  const fileName = `${propertyId}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from('property-documents')
    .upload(fileName, file);

  if (error) return { data: null, error };

  const { user, error: userError } = await getUser();
  if (userError) return { data: null, error: userError };

  const { data: docData, error: docError } = await supabase
    .from('property_documents')
    .insert([{
      property_id: propertyId,
      document_name: file.name,
      document_type: documentType,
      file_path: fileName,
      file_size: file.size,
      uploaded_by: user.id,
    }])
    .select()
    .single();

  return { data: docData, error: docError };
}

export async function getDocumentUrl(filePath) {
  const { data } = supabase.storage
    .from('property-documents')
    .getPublicUrl(filePath);
  return data.publicUrl;
}

export async function deleteDocumentFile(filePath) {
  const { error } = await supabase.storage
    .from('property-documents')
    .remove([filePath]);
  return { error };
}

// Utility function to generate random token
function generateToken() {
  return 'share_' + Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}
