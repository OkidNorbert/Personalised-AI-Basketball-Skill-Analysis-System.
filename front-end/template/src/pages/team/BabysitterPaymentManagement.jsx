import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import api from '@/utils/axiosConfig';
import { 
  DollarSign, 
  AlertCircle, 
  RefreshCw, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { showToast } from '@/components/shared/Toast';
import axios from 'axios';

const BabysitterPaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [babysitters, setBabysitters] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState('full-day');
  const [childrenCount, setChildrenCount] = useState(1);
  const [selectedBabysitter, setSelectedBabysitter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [expandedPayment, setExpandedPayment] = useState(null);
  const { isDarkMode } = useTheme();

  const fetchBabysitterPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/payments/babysitter/history');
      
      // Ensure payments is always an array
      if (response.data && Array.isArray(response.data)) {
        setPayments(response.data);
      } else if (response.data && response.data.payments && Array.isArray(response.data.payments)) {
        setPayments(response.data.payments);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching babysitter payments:', error);
      setError('Failed to fetch payment history');
      setPayments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchBabysitters = async () => {
    try {
      console.log('Fetching babysitters...');
      const response = await api.get('/admin/babysitters');
      const babysittersList = response.data || [];
      
      // Filter out only active babysitters if there are any
      const activeBabysitters = babysittersList.filter(babysitter => babysitter.status === 'active');
      
      console.log(`Found ${babysittersList.length} total babysitters, ${activeBabysitters.length} active`);
      console.log('Active babysitters:', activeBabysitters);
      
      setBabysitters(activeBabysitters);
      
      // Reset selected babysitter if it's not in the active list
      if (selectedBabysitter && !activeBabysitters.some(b => b.id === selectedBabysitter)) {
        setSelectedBabysitter('');
      }
    } catch (error) {
      console.error('Error fetching babysitters:', error);
      showToast('Failed to load babysitters', 'error');
    }
  };

  useEffect(() => {
    fetchBabysitterPayments();
    fetchBabysitters();
  }, []);

  const handleGeneratePayment = async () => {
    if (!selectedBabysitter) {
      showToast('Please select a babysitter', 'error');
      return;
    }
    
    if (!childrenCount || childrenCount < 1) {
      showToast('Please enter a valid number of children', 'error');
      return;
    }

    try {
      setIsGenerating(true);
      
      // Find the selected babysitter object to get their ID
      const selectedBabysitterObj = babysitters.find(b => b.id === selectedBabysitter);
      
      if (!selectedBabysitterObj) {
        console.error('Selected babysitter not found:', selectedBabysitter);
        console.error('Available babysitters:', babysitters);
        showToast('Selected babysitter not found', 'error');
        return;
      }
      
      console.log("Sending manual payment generation request:", {
        babysitterId: selectedBabysitterObj.id,
        date: selectedDate,
        sessionType,
        childrenCount: parseInt(childrenCount)
      });
      
      const response = await api.post('/payments/babysitter/daily', {
        babysitterId: selectedBabysitterObj.id,
        date: selectedDate,
        sessionType,
        childrenCount: parseInt(childrenCount)
      });
      
      showToast('Payment record generated successfully', 'success');
      fetchBabysitterPayments();
    } catch (error) {
      console.error('Error generating payment:', error);
      let errorMessage = 'Failed to generate payment record';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoGeneratePayments = async () => {
    try {
      setIsAutoGenerating(true);
      
      // Ensure there are active babysitters before attempting to generate payments
      if (babysitters.length === 0) {
        showToast('Cannot auto-generate payments: No active babysitters available', 'error');
        return;
      }
      
      console.log("Sending auto-generate request with date:", selectedDate);
      
      const response = await api.post('/admin/payments/babysitter/auto-generate', {
        date: selectedDate
      });
      
      if (response.data && response.data.totalPaymentsGenerated === 0) {
        showToast('No payments were generated. There may be no active schedules for this date.', 'info');
      } else {
        showToast(`Generated ${response.data.totalPaymentsGenerated} payment records`, 'success');
      }
      
      // Refresh the payments list
      fetchBabysitterPayments();
    } catch (error) {
      console.error('Error auto-generating payments:', error);
      let errorMessage = 'Failed to auto-generate payment records';
      
      // Check for specific error messages from the server
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const handleVerifyPayment = async (paymentId) => {
    try {
      await api.put(`/payments/babysitter/${paymentId}/verify`);
      showToast('Payment verified successfully', 'success');
      
      // Update the payment in the state
      setPayments(payments.map(payment => 
        payment._id === paymentId ? { ...payment, status: 'verified', verifiedAt: new Date() } : payment
      ));
    } catch (error) {
      console.error('Error verifying payment:', error);
      let errorMessage = 'Failed to verify payment';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      showToast(errorMessage, 'error');
    }
  };

  const toggleExpandPayment = (paymentId) => {
    setExpandedPayment(expandedPayment === paymentId ? null : paymentId);
  };

  const handleBabysitterChange = (e) => {
    const selectedId = e.target.value;
    console.log('Selected babysitter ID:', selectedId);
    const selectedBabysitter = babysitters.find(b => b.id === selectedId);
    console.log('Found babysitter:', selectedBabysitter);
    setSelectedBabysitter(selectedId);
  };

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-b from-gray-900 to-indigo-950 text-white' 
        : 'bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className={`text-2xl font-bold ${
              isDarkMode 
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400' 
                : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}>Babysitter Payment Management</h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Record and track babysitter payments
            </p>
          </div>
        </div>
        
        {/* Payment generation sections */}
        <div className={`rounded-xl mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow'} p-6`}>
          <h2 className="text-lg font-semibold mb-4">Record Payment Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manual payment generation */}
            <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <h3 className="text-md font-medium mb-3">Manual Payment Record</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Babysitter</label>
                  <select
                    value={selectedBabysitter}
                    onChange={handleBabysitterChange}
                    className={`w-full px-3 py-2 rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-700 text-white border-gray-600'
                        : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  >
                    <option key="default" value="">Select Babysitter</option>
                    {babysitters.map(babysitter => (
                      <option 
                        key={babysitter.id}
                        value={babysitter.id}
                      >
                        {babysitter.firstName} {babysitter.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-700 text-white border-gray-600'
                        : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-1">Session Type</label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-700 text-white border-gray-600'
                        : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  >
                    <option value="half-day">Half Day (2,000K per child)</option>
                    <option value="full-day">Full Day (5,000K per child)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm mb-1">Number of Children</label>
                  <input
                    type="number"
                    min="1"
                    value={childrenCount}
                    onChange={(e) => setChildrenCount(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-700 text-white border-gray-600'
                        : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  />
                </div>
              </div>
                
              <div className="mt-4">
                <button
                  onClick={handleGeneratePayment}
                  disabled={isGenerating || !selectedBabysitter}
                  className={`w-full py-2 rounded-lg flex items-center justify-center ${
                    isGenerating || !selectedBabysitter
                      ? isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                      : isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Record Payment
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Auto payment generation */}
            <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <h3 className="text-md font-medium mb-3">Bulk Payment Records</h3>
              <p className="text-sm mb-3 text-gray-500">
                Automatically generate payment records for all active babysitters based on their scheduled sessions for the selected date.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-700 text-white border-gray-600'
                        : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={handleAutoGeneratePayments}
                  disabled={isAutoGenerating}
                  className={`w-full py-2 rounded-lg flex items-center justify-center ${
                    isAutoGenerating
                      ? isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                      : isDarkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }`}
                >
                  {isAutoGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Auto-Generate Records
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment records list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
            <p className="text-lg">Loading payment data...</p>
          </div>
        ) : error ? (
          <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-red-900/50' : 'bg-red-100'} mb-6`}>
            <div className="flex items-center">
              <AlertCircle className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-red-300' : 'text-red-500'}`} />
              <p className={isDarkMode ? 'text-red-300' : 'text-red-700'}>{error}</p>
            </div>
            <button
              onClick={fetchBabysitterPayments}
              className={`mt-4 px-4 py-2 rounded-lg ${
                isDarkMode
                  ? 'bg-red-700 hover:bg-red-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              Try Again
            </button>
          </div>
        ) : payments.length === 0 ? (
          <div className={`rounded-lg p-12 ${isDarkMode ? 'bg-gray-800/70' : 'bg-white'} mb-6 text-center`}>
            <DollarSign className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-300'}`} />
            <h2 className="text-xl font-semibold mb-2">No Payment Records Found</h2>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              There are no babysitter payment records yet. Generate payments using the controls above.
            </p>
          </div>
        ) : (
          <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800/70' : 'bg-white'} mb-6 overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Babysitter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Children
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map(payment => (
                    <React.Fragment key={payment._id}>
                      <tr 
                        className={`cursor-pointer ${
                          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => toggleExpandPayment(payment._id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                              isDarkMode ? 'bg-indigo-900' : 'bg-indigo-100'
                            }`}>
                              <span className={`text-lg font-medium ${
                                isDarkMode ? 'text-indigo-300' : 'text-indigo-600'
                              }`}>
                                {payment.babysitterId?.firstName?.charAt(0) || 'B'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="font-medium">
                                {payment.babysitterId?.firstName} {payment.babysitterId?.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            payment.sessionType === 'half-day'
                              ? isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                              : isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {payment.sessionType === 'half-day' ? 'Half Day' : 'Full Day'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            <span>{payment.numberOfChildren}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>
                            {payment.totalAmount.toLocaleString()}K
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            payment.status === 'verified'
                              ? isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                              : isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end items-center space-x-2">
                            {payment.status !== 'verified' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVerifyPayment(payment._id);
                                }}
                                className={`p-1.5 rounded-full ${
                                  isDarkMode
                                    ? 'bg-green-900 text-green-300 hover:bg-green-800'
                                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                                }`}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandPayment(payment._id);
                              }}
                              className={`p-1.5 rounded-full ${
                                isDarkMode
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {expandedPayment === payment._id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedPayment === payment._id && (
                        <tr className={isDarkMode ? 'bg-gray-750' : 'bg-gray-50'}>
                          <td colSpan="7" className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h3 className="font-medium mb-2">Payment Details</h3>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Amount per child:</span>
                                    <span>{payment.amountPerChild}K</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Number of children:</span>
                                    <span>{payment.numberOfChildren}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Total amount:</span>
                                    <span className="font-medium">{payment.totalAmount.toLocaleString()}K</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Recorded at:</span>
                                    <span>{new Date(payment.recordedAt).toLocaleString()}</span>
                                  </div>
                                  {payment.verifiedAt && (
                                    <div className="flex justify-between">
                                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Verified at:</span>
                                      <span>{new Date(payment.verifiedAt).toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h3 className="font-medium mb-2">Actions</h3>
                                {payment.status !== 'verified' ? (
                                  <button
                                    onClick={() => handleVerifyPayment(payment._id)}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                                      isDarkMode
                                        ? 'bg-green-700 hover:bg-green-600 text-white'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                    }`}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Verify Payment</span>
                                  </button>
                                ) : (
                                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                    This payment has been verified and cannot be modified.
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BabysitterPaymentManagement;
