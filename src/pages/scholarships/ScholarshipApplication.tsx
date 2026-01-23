import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  User,
  Briefcase,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertCircle,
  Upload,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';
import { useScholarshipsStore, useApplicationsStore } from '@/stores/sponsorshipStore';
import { useAuthStore } from '@/stores/authStore';
import type { EducationHistoryItem, CertificationItem, ScholarshipApplicationFormData } from '@/types/sponsorship';

// Step configuration
const steps = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Background', icon: Briefcase },
  { id: 3, title: 'Statement', icon: FileText },
  { id: 4, title: 'Review', icon: CheckCircle2 },
];

export default function ScholarshipApplication() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentScholarship, fetchScholarship } = useScholarshipsStore();
  const { submitApplication, isSubmitting, error: submitError } = useApplicationsStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ScholarshipApplicationFormData>({
    fullName: user?.displayName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    staffId: '',
    mdaId: user?.mdaId || '',
    department: user?.department || '',
    currentPosition: user?.title || '',
    yearsOfService: undefined,
    currentGrade: user?.gradeLevel || '',
    dateOfBirth: '',
    educationHistory: [],
    certifications: [],
    careerGoals: '',
    statementOfPurpose: '',
    expectedImpact: '',
    howDiscovered: '',
    supervisorName: '',
    supervisorEmail: '',
    supervisorPhone: '',
  });

  useEffect(() => {
    if (id) {
      fetchScholarship(id).catch(() => navigate('/scholarships'));
    }
  }, [id, fetchScholarship, navigate]);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.displayName || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        mdaId: user.mdaId || prev.mdaId,
        department: user.department || prev.department,
        currentPosition: user.title || prev.currentPosition,
        currentGrade: user.gradeLevel || prev.currentGrade,
      }));
    }
  }, [user]);

  const updateField = (field: keyof ScholarshipApplicationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Education history management
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      educationHistory: [
        ...prev.educationHistory,
        { institution: '', degree: '', fieldOfStudy: '', startYear: 2020, endYear: undefined, grade: '', isOngoing: false },
      ],
    }));
  };

  const updateEducation = (index: number, field: keyof EducationHistoryItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      educationHistory: prev.educationHistory.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      educationHistory: prev.educationHistory.filter((_, i) => i !== index),
    }));
  };

  // Certification management
  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [
        ...(prev.certifications || []),
        { name: '', issuingOrganization: '', issueDate: '', expiryDate: '', credentialId: '' },
      ],
    }));
  };

  const updateCertification = (index: number, field: keyof CertificationItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications?.map((cert, i) =>
        i === index ? { ...cert, [field]: value } : cert
      ),
    }));
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications?.filter((_, i) => i !== index),
    }));
  };

  // Validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    if (step === 3) {
      if (!formData.statementOfPurpose.trim()) {
        newErrors.statementOfPurpose = 'Statement of purpose is required';
      } else if (formData.statementOfPurpose.length < 100) {
        newErrors.statementOfPurpose = 'Statement must be at least 100 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    if (!id) return;

    try {
      await submitApplication(id, formData);
      navigate('/scholarships/my-applications', {
        state: { success: 'Application submitted successfully!' },
      });
    } catch (err) {
      // Error is handled by the store
    }
  };

  if (!currentScholarship) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ghana-green mx-auto mb-4" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            to={`/scholarships/${id}`}
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Scholarship
          </Link>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Scholarship Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-surface-200 p-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-ghana-green/10 flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-ghana-green" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">{currentScholarship.title}</h1>
              <p className="text-text-secondary">
                {currentScholarship.currency} {currentScholarship.amount.toLocaleString()} Scholarship
              </p>
            </div>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        h-12 w-12 rounded-xl flex items-center justify-center transition-all
                        ${isActive ? 'bg-ghana-green text-white shadow-lg' :
                          isCompleted ? 'bg-green-100 text-green-600' :
                          'bg-surface-100 text-text-tertiary'}
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`mt-2 text-sm font-medium ${isActive ? 'text-ghana-green' : 'text-text-tertiary'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 w-16 mx-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-surface-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Form Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-surface-200 p-8"
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                  <User className="h-5 w-5 text-ghana-green" />
                  Personal Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.fullName ? 'border-red-500' : 'border-surface-200'} focus:ring-2 focus:ring-ghana-green focus:border-transparent`}
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-surface-200'} focus:ring-2 focus:ring-ghana-green focus:border-transparent`}
                      placeholder="Enter your email"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:ring-2 focus:ring-ghana-green focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Staff ID</label>
                    <input
                      type="text"
                      value={formData.staffId || ''}
                      onChange={(e) => updateField('staffId', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:ring-2 focus:ring-ghana-green focus:border-transparent"
                      placeholder="Enter your staff ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Department</label>
                    <input
                      type="text"
                      value={formData.department || ''}
                      onChange={(e) => updateField('department', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:ring-2 focus:ring-ghana-green focus:border-transparent"
                      placeholder="Enter your department"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Current Position</label>
                    <input
                      type="text"
                      value={formData.currentPosition || ''}
                      onChange={(e) => updateField('currentPosition', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:ring-2 focus:ring-ghana-green focus:border-transparent"
                      placeholder="Enter your current position"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Years of Service</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.yearsOfService || ''}
                      onChange={(e) => updateField('yearsOfService', parseInt(e.target.value) || undefined)}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:ring-2 focus:ring-ghana-green focus:border-transparent"
                      placeholder="Years of service"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Current Grade Level</label>
                    <input
                      type="text"
                      value={formData.currentGrade || ''}
                      onChange={(e) => updateField('currentGrade', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:ring-2 focus:ring-ghana-green focus:border-transparent"
                      placeholder="e.g., Grade 10"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Background */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-ghana-green" />
                  Education & Professional Background
                </h2>

                {/* Education History */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-text-primary">Education History</h3>
                    <button
                      type="button"
                      onClick={addEducation}
                      className="flex items-center gap-2 text-sm text-ghana-green font-medium hover:underline"
                    >
                      <Plus className="h-4 w-4" /> Add Education
                    </button>
                  </div>
                  {formData.educationHistory.map((edu, index) => (
                    <div key={index} className="bg-surface-50 rounded-xl p-4 mb-4">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-sm font-medium text-text-tertiary">Education #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                          placeholder="Institution"
                          className="px-4 py-2 rounded-lg border border-surface-200 focus:ring-2 focus:ring-ghana-green"
                        />
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                          placeholder="Degree"
                          className="px-4 py-2 rounded-lg border border-surface-200 focus:ring-2 focus:ring-ghana-green"
                        />
                        <input
                          type="text"
                          value={edu.fieldOfStudy}
                          onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                          placeholder="Field of Study"
                          className="px-4 py-2 rounded-lg border border-surface-200 focus:ring-2 focus:ring-ghana-green"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={edu.startYear}
                            onChange={(e) => updateEducation(index, 'startYear', parseInt(e.target.value))}
                            placeholder="Start Year"
                            className="flex-1 px-4 py-2 rounded-lg border border-surface-200 focus:ring-2 focus:ring-ghana-green"
                          />
                          <input
                            type="number"
                            value={edu.endYear || ''}
                            onChange={(e) => updateEducation(index, 'endYear', parseInt(e.target.value) || undefined)}
                            placeholder="End Year"
                            className="flex-1 px-4 py-2 rounded-lg border border-surface-200 focus:ring-2 focus:ring-ghana-green"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {formData.educationHistory.length === 0 && (
                    <p className="text-sm text-text-tertiary text-center py-4 bg-surface-50 rounded-xl">
                      No education history added. Click "Add Education" to add your educational background.
                    </p>
                  )}
                </div>

                {/* Certifications */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-text-primary">Professional Certifications</h3>
                    <button
                      type="button"
                      onClick={addCertification}
                      className="flex items-center gap-2 text-sm text-ghana-green font-medium hover:underline"
                    >
                      <Plus className="h-4 w-4" /> Add Certification
                    </button>
                  </div>
                  {formData.certifications?.map((cert, index) => (
                    <div key={index} className="bg-surface-50 rounded-xl p-4 mb-4">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-sm font-medium text-text-tertiary">Certification #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeCertification(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => updateCertification(index, 'name', e.target.value)}
                          placeholder="Certification Name"
                          className="px-4 py-2 rounded-lg border border-surface-200 focus:ring-2 focus:ring-ghana-green"
                        />
                        <input
                          type="text"
                          value={cert.issuingOrganization}
                          onChange={(e) => updateCertification(index, 'issuingOrganization', e.target.value)}
                          placeholder="Issuing Organization"
                          className="px-4 py-2 rounded-lg border border-surface-200 focus:ring-2 focus:ring-ghana-green"
                        />
                        <input
                          type="date"
                          value={cert.issueDate}
                          onChange={(e) => updateCertification(index, 'issueDate', e.target.value)}
                          className="px-4 py-2 rounded-lg border border-surface-200 focus:ring-2 focus:ring-ghana-green"
                        />
                        <input
                          type="text"
                          value={cert.credentialId || ''}
                          onChange={(e) => updateCertification(index, 'credentialId', e.target.value)}
                          placeholder="Credential ID (optional)"
                          className="px-4 py-2 rounded-lg border border-surface-200 focus:ring-2 focus:ring-ghana-green"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Career Goals */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Career Goals</label>
                  <textarea
                    value={formData.careerGoals || ''}
                    onChange={(e) => updateField('careerGoals', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:ring-2 focus:ring-ghana-green focus:border-transparent"
                    placeholder="Describe your career goals and aspirations..."
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Statement */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                  <FileText className="h-5 w-5 text-ghana-green" />
                  Personal Statement
                </h2>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Statement of Purpose <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-text-tertiary mb-2">
                    Explain why you are applying for this scholarship and how it aligns with your career goals.
                  </p>
                  <textarea
                    value={formData.statementOfPurpose}
                    onChange={(e) => updateField('statementOfPurpose', e.target.value)}
                    rows={8}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.statementOfPurpose ? 'border-red-500' : 'border-surface-200'} focus:ring-2 focus:ring-ghana-green focus:border-transparent`}
                    placeholder="Write your statement of purpose here... (minimum 100 characters)"
                  />
                  <div className="flex justify-between mt-1">
                    {errors.statementOfPurpose && (
                      <p className="text-sm text-red-500">{errors.statementOfPurpose}</p>
                    )}
                    <p className="text-sm text-text-tertiary ml-auto">
                      {formData.statementOfPurpose.length} characters
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Expected Impact
                  </label>
                  <p className="text-sm text-text-tertiary mb-2">
                    How will this scholarship benefit your work and the public service?
                  </p>
                  <textarea
                    value={formData.expectedImpact || ''}
                    onChange={(e) => updateField('expectedImpact', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:ring-2 focus:ring-ghana-green focus:border-transparent"
                    placeholder="Describe the expected impact..."
                  />
                </div>

                {/* Supervisor Information */}
                <div>
                  <h3 className="font-medium text-text-primary mb-4">Supervisor Information (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={formData.supervisorName || ''}
                      onChange={(e) => updateField('supervisorName', e.target.value)}
                      placeholder="Supervisor Name"
                      className="px-4 py-3 rounded-xl border border-surface-200 focus:ring-2 focus:ring-ghana-green"
                    />
                    <input
                      type="email"
                      value={formData.supervisorEmail || ''}
                      onChange={(e) => updateField('supervisorEmail', e.target.value)}
                      placeholder="Supervisor Email"
                      className="px-4 py-3 rounded-xl border border-surface-200 focus:ring-2 focus:ring-ghana-green"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-ghana-green" />
                  Review Your Application
                </h2>

                {submitError && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{submitError}</p>
                  </div>
                )}

                {/* Personal Info Summary */}
                <div className="bg-surface-50 rounded-xl p-4">
                  <h3 className="font-medium text-text-primary mb-3">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-text-tertiary">Name:</span> <span className="text-text-primary">{formData.fullName}</span></div>
                    <div><span className="text-text-tertiary">Email:</span> <span className="text-text-primary">{formData.email}</span></div>
                    <div><span className="text-text-tertiary">Department:</span> <span className="text-text-primary">{formData.department || 'Not specified'}</span></div>
                    <div><span className="text-text-tertiary">Position:</span> <span className="text-text-primary">{formData.currentPosition || 'Not specified'}</span></div>
                  </div>
                </div>

                {/* Education Summary */}
                <div className="bg-surface-50 rounded-xl p-4">
                  <h3 className="font-medium text-text-primary mb-3">Education</h3>
                  {formData.educationHistory.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {formData.educationHistory.map((edu, i) => (
                        <li key={i} className="text-text-secondary">
                          {edu.degree} in {edu.fieldOfStudy} - {edu.institution} ({edu.startYear}-{edu.endYear || 'Present'})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-text-tertiary">No education history provided</p>
                  )}
                </div>

                {/* Statement Summary */}
                <div className="bg-surface-50 rounded-xl p-4">
                  <h3 className="font-medium text-text-primary mb-3">Statement of Purpose</h3>
                  <p className="text-sm text-text-secondary line-clamp-4">{formData.statementOfPurpose}</p>
                </div>

                {/* Declaration */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800">
                    By submitting this application, I declare that all information provided is accurate and complete.
                    I understand that providing false information may result in disqualification.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-200">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                currentStep === 1
                  ? 'bg-surface-100 text-text-tertiary cursor-not-allowed'
                  : 'bg-surface-100 text-text-primary hover:bg-surface-200'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-ghana-green text-white rounded-xl font-medium hover:bg-ghana-green/90 transition-colors"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-ghana-green text-white rounded-xl font-medium hover:bg-ghana-green/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
