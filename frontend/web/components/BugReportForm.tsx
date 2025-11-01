import React, { useState, useEffect } from 'react';
import { bugReportAPI, BugReportData, Category } from '../lib/bugReportAPI';
import { useAuth } from '../contexts/AuthContext';

interface BugReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BugReportForm({ isOpen, onClose, onSuccess }: BugReportFormProps) {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<BugReportData>({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    userEmail: '',
    userName: '',
    userPhone: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: ''
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      // Auto-fill device info and user data
      const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
      setFormData(prev => ({
        ...prev,
        deviceInfo: bugReportAPI.getDeviceInfo(),
        userEmail: user?.email || prev.userEmail || '',
        userName: fullName || prev.userName || ''
      }));
    }
  }, [isOpen, user]);

  const loadCategories = async () => {
    const result = await bugReportAPI.getCategories();
    if (result.success && result.data) {
      setCategories(result.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);
    setSuccessMessage('');

    // Validate form
    const validation = bugReportAPI.validateBugReport(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await bugReportAPI.submitBugReport(formData);
      
      if (result.success) {
        setSuccessMessage('Paldies! Jūsu ziņojums ir nosūtīts un tiks izskatīts.');
        setTimeout(() => {
          onSuccess?.();
          onClose();
          resetForm();
        }, 2000);
      } else {
        setErrors([result.message || 'Neizdevās nosūtīt ziņojumu']);
      }
    } catch (error) {
      setErrors(['Neizdevās nosūtīt ziņojumu. Lūdzu mēģiniet vēlāk.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      userEmail: user?.email || '',
      userName: fullName || '',
      userPhone: '',
      stepsToReproduce: '',
      expectedBehavior: '',
      actualBehavior: ''
    });
    setErrors([]);
    setSuccessMessage('');
    setShowAdvancedFields(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-adaptive-white">Ziņot par problēmu</h2>
            <button
              onClick={onClose}
              className="text-adaptive-light hover:text-adaptive-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {successMessage && (
            <div className="mb-4 p-4 bg-green-600 text-white rounded-lg">
              {successMessage}
            </div>
          )}

          {errors.length > 0 && (
            <div className="mb-4 p-4 bg-red-600 text-white rounded-lg">
              <ul className="list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Nosaukums *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
                placeholder="Īss problēmas apraksts"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                Kategorija *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
                required
              >
                <option value="">Izvēlieties kategoriju</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-2">
                Prioritāte
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
              >
                <option value="low">Zema</option>
                <option value="medium">Vidēja</option>
                <option value="high">Augsta</option>
                <option value="critical">Kritiska</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Apraksts *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
                placeholder="Detalizēts problēmas apraksts"
                required
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-300 mb-2">
                  Vārds
                </label>
                <input
                  type="text"
                  id="userName"
                  name="userName"
                  value={formData.userName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
                  placeholder="Jūsu vārds"
                />
              </div>
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-gray-300 mb-2">
                  E-pasts
                </label>
                <input
                  type="email"
                  id="userEmail"
                  name="userEmail"
                  value={formData.userEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
                  placeholder="jūsu@epasts.lv"
                />
              </div>
            </div>

            {/* Advanced Fields Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                className="text-coral-500 hover:text-coral-400 transition-colors"
              >
                {showAdvancedFields ? '▼' : '▶'} Papildu informācija (neobligāti)
              </button>
            </div>

            {showAdvancedFields && (
              <div className="space-y-4 pl-4 border-l-2 border-gray-600">
                {/* Steps to Reproduce */}
                <div>
                  <label htmlFor="stepsToReproduce" className="block text-sm font-medium text-gray-300 mb-2">
                    Reproducēšanas soļi
                  </label>
                  <textarea
                    id="stepsToReproduce"
                    name="stepsToReproduce"
                    value={formData.stepsToReproduce}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
                    placeholder="1. Atveriet... 2. Noklikšķiniet uz... 3. Redzama kļūda..."
                  />
                </div>

                {/* Expected vs Actual Behavior */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expectedBehavior" className="block text-sm font-medium text-gray-300 mb-2">
                      Gaidītā rīcība
                    </label>
                    <textarea
                      id="expectedBehavior"
                      name="expectedBehavior"
                      value={formData.expectedBehavior}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
                      placeholder="Ko gaidījāt, ka notiks?"
                    />
                  </div>
                  <div>
                    <label htmlFor="actualBehavior" className="block text-sm font-medium text-gray-300 mb-2">
                      Faktiskā rīcība
                    </label>
                    <textarea
                      id="actualBehavior"
                      name="actualBehavior"
                      value={formData.actualBehavior}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
                      placeholder="Ko faktiski notika?"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="userPhone" className="block text-sm font-medium text-gray-300 mb-2">
                    Tālrunis
                  </label>
                  <input
                    type="tel"
                    id="userPhone"
                    name="userPhone"
                    value={formData.userPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
                    placeholder="+371 XXXXXXXX"
                  />
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
              >
                Atcelt
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-coral-600 text-white rounded-md hover:bg-coral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Nosūta...' : 'Nosūtīt ziņojumu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}