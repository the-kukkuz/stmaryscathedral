/**
 * Utility functions for inferring family relationships and building addresses
 * Used by death records and marriage records to auto-populate data
 */

/**
 * Normalizes relation strings to handle variations in capitalization and spacing
 * Examples: "Grand Son" → "grandson", "HoF" → "husband", "son" → "son"
 */
export const normalizeRelation = (relation) => {
  if (!relation) return '';
  
  const normalized = relation.toLowerCase().trim().replace(/\s+/g, '');
  
  // Map common variations to standard forms
  const relationMap = {
    'hof': 'husband',
    'headoffamily': 'husband',
    'grandson': 'grandson',
    'granddaughter': 'granddaughter',
    'granddson': 'grandson', // typo correction
    'daughterinlaw': 'daughter-in-law',
    'soninlaw': 'son-in-law'
  };
  
  return relationMap[normalized] || normalized;
};

/**
 * Builds a complete address string from family data
 * Combines location (street address) and village (city/district)
 */
export const buildAddress = (family) => {
  if (!family) return '';
  
  const parts = [];
  
  if (family.location) parts.push(family.location.trim());
  if (family.village) parts.push(family.village.trim());
  
  return parts.join(', ');
};

/**
 * Infers parent names or spouse name based on member's relation and family structure
 * 
 * Logic:
 * - For children (son/daughter/grandson/granddaughter): Find parents from other family members
 * - For spouse (wife): Returns HoF name as husband
 * - For HoF/husband: Finds wife from other family members
 * - For extended family: Attempts to infer parents from family structure
 * 
 * @param {Object} member - The member whose parents/spouse we're inferring
 * @param {Array} familyMembers - All members of the same family
 * @param {String} hofName - Head of Family name from family record
 * @returns {Object} { fatherName, motherName, spouseName }
 */
export const inferParentSpouseNames = (member, familyMembers = [], hofName = '') => {
  const result = {
    fatherName: '',
    motherName: '',
    spouseName: ''
  };
  
  if (!member || !member.relation) return result;
  
  const relation = normalizeRelation(member.relation);
  
  // Find potential parents and spouses from family members
  let father = null;
  let mother = null;
  let spouse = null;

  const isMale = (gender) => (gender || '').toLowerCase() === 'male';
  const isFemale = (gender) => (gender || '').toLowerCase() === 'female';

  const fatherCandidates = [];
  const motherCandidates = [];
  
  familyMembers.forEach(mem => {
    const memRelation = normalizeRelation(mem.relation);

    if ((memRelation === 'father') || ((memRelation === 'husband' || memRelation === 'hof') && isMale(mem.gender))) {
      fatherCandidates.push(mem);
    }

    if ((memRelation === 'mother') || ((memRelation === 'wife') && isFemale(mem.gender))) {
      motherCandidates.push(mem);
    }
    
    // For HoF looking for wife
    if (relation === 'husband' && memRelation === 'wife') {
      spouse = mem;
    }
    
    // For wife looking for husband
    if (relation === 'wife' && (memRelation === 'husband' || memRelation === 'hof')) {
      spouse = mem;
    }
  });

  father = fatherCandidates.find((mem) => normalizeRelation(mem.relation) === 'father')
    || fatherCandidates.find((mem) => normalizeRelation(mem.relation) === 'husband' || normalizeRelation(mem.relation) === 'hof')
    || null;

  mother = motherCandidates.find((mem) => normalizeRelation(mem.relation) === 'mother')
    || motherCandidates.find((mem) => normalizeRelation(mem.relation) === 'wife')
    || null;
  
  // Infer based on relation type
  switch (relation) {
    case 'son':
    case 'daughter':
      // Direct children - use found father/mother
      if (father) result.fatherName = father.name || '';
      else if (hofName) result.fatherName = hofName;
      if (mother) result.motherName = mother.name || '';
      break;
      
    case 'grandson':
    case 'granddaughter':
      // Grandchildren - parents might be son/daughter in the family
      // For now, show grandparents as parents (can be edited if needed)
      if (father) result.fatherName = father.name || '';
      else if (hofName) result.fatherName = hofName;
      if (mother) result.motherName = mother.name || '';
      break;
      
    case 'wife':
      // Wife's spouse is the HoF
      if (hofName) {
        result.spouseName = hofName;
      } else if (father) {
        result.spouseName = father.name || '';
      }
      break;
      
    case 'husband':
    case 'hof':
      // HoF's spouse is the wife
      if (spouse) {
        result.spouseName = spouse.name || '';
      } else if (mother) {
        result.spouseName = mother.name || '';
      }
      break;
      
    case 'father':
      // Father's spouse is mother
      if (mother) result.spouseName = mother.name || '';
      break;
      
    case 'mother':
      // Mother's spouse is father
      if (father) result.spouseName = father.name || '';
      break;
      
    case 'brother':
    case 'sister':
      // Siblings - same parents as other children
      if (father) result.fatherName = father.name || '';
      if (mother) result.motherName = mother.name || '';
      break;
      
    case 'daughter-in-law': {
      // Daughter-in-law's spouse is a son
      const son = familyMembers.find(mem => normalizeRelation(mem.relation) === 'son');
      if (son) result.spouseName = son.name || '';
      break;
    }
      
    case 'son-in-law': {
      // Son-in-law's spouse is a daughter
      const daughter = familyMembers.find(mem => normalizeRelation(mem.relation) === 'daughter');
      if (daughter) result.spouseName = daughter.name || '';
      break;
    }
      
    default:
      // For other relations, try to find basic father/mother if they exist
      if (father) result.fatherName = father.name || '';
      if (mother) result.motherName = mother.name || '';
      break;
  }
  
  return result;
};
