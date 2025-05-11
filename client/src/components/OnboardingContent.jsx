import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Include html2pdf.js library (add this script tag to your public/index.html or equivalent)
// <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>


// Client Onboarding Module - Multi-step Form
export default function OnboardingContent({ user }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Section 1: Basic Details
    fullName: user?.username || '', // Pre-fill from user data
    govtIdNumber: '',
    mobile: '',
    email: user?.username || '', // Pre-fill from user data (assuming username is email or similar)
    // Section 2: Investment Profile
    timeHorizon: '',
    riskTolerance: '',
    investmentsOwned: [], // Array for checkboxes
    acceptableAnnualReturn: '', // Radio button value
    // Section 3: Client Details
    dob: '',
    nationality: '',
    address: '',
    clientType: '',
    govtIdFile: null, // File object
    contactDetails: '', // Assuming this is additional contact info
    // Section 4: Financial Details
    sourceOfFunds: '',
    occupationDetails: '',
    incomeProofFile: null, // File object
    // Section 5: Fund Selection
    selectedFunds: [], // Array of selected funds with amounts
  });

  const [availableFunds, setAvailableFunds] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState(false); // State for terms checkbox
  const [isSubmitting, setIsSubmitting] = useState(false); // State for submission loading
  const summaryRef = useRef(null); // Ref for the summary content element
  const navigate = useNavigate(); // Get the navigate function


  // Simulate fetching funds based on risk tolerance whenever it changes
  useEffect(() => {
    // In a real app, you would make an API call here
    console.log("Risk Tolerance changed:", formData.riskTolerance);
    let funds = [];
    switch (formData.riskTolerance) {
      case 'low':
        funds = [{ id: 1, name: 'Conservative Bond Fund', description: 'Low risk, stable returns.' }, { id: 2, name: 'Money Market Fund', description: 'Very low risk, low returns.' }];
        break;
      case 'moderate':
        funds = [{ id: 3, name: 'Balanced Growth Fund', description: 'Mix of stocks and bonds, moderate risk.' }, { id: 4, name: 'Real Estate Fund', description: 'Invests in properties, moderate risk.' }];
        break;
      case 'high':
        funds = [{ id: 5, name: 'Aggressive Equity Fund', description: 'High growth potential, high risk.' }, { id: 6, name: 'Emerging Markets Fund', description: 'Invests in developing economies, high risk.' }];
        break;
      default:
        funds = [];
    }
    setAvailableFunds(funds);
  }, [formData.riskTolerance]); // Dependency array includes riskTolerance


  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'checkbox') {
      setFormData({
        ...formData,
        investmentsOwned: checked
          ? [...formData.investmentsOwned, value]
          : formData.investmentsOwned.filter(item => item !== value),
      });
    } else if (type === 'file') {
      setFormData({
        ...formData,
        [name]: files[0], // Store the file object
      });
    }
    else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleFundSelectionChange = (fundId, amount) => {
      setFormData(prevFormData => {
          const existingFundIndex = prevFormData.selectedFunds.findIndex(fund => fund.id === fundId);

          if (existingFundIndex > -1) {
              // Update existing fund amount
              const updatedFunds = [...prevFormData.selectedFunds];
              if (amount === '' || parseFloat(amount) <= 0) {
                  // Remove fund if amount is empty or zero/negative
                  updatedFunds.splice(existingFundIndex, 1);
              } else {
                  updatedFunds[existingFundIndex] = { ...updatedFunds[existingFundIndex], amount: parseFloat(amount) };
              }
              return { ...prevFormData, selectedFunds: updatedFunds };
          } else {
              // Add new fund if amount is positive
              if (amount !== '' && parseFloat(amount) > 0) {
                  const fund = availableFunds.find(f => f.id === fundId);
                   if (fund) {
                       return { ...prevFormData, selectedFunds: [...prevFormData.selectedFunds, { id: fund.id, name: fund.name, amount: parseFloat(amount) }] }; // Use fund.id here
                   }
              }
              return prevFormData; // No change if adding with invalid amount
          }
      });
  };


  const nextStep = () => {
    // Basic validation before moving to the next step
    if (step === 1 && (!formData.fullName || !formData.govtIdNumber || !formData.mobile || !formData.email)) {
      alert('Please fill in all basic details.');
      return;
    }
     if (step === 2 && (!formData.timeHorizon || !formData.riskTolerance || formData.acceptableAnnualReturn === '')) {
       alert('Please complete your investment profile.');
       return;
     }
     if (step === 3 && (!formData.dob || !formData.nationality || !formData.address || !formData.clientType || !formData.govtIdFile)) {
        alert('Please complete client details and upload your Govt ID.');
        return;
     }
     if (step === 4 && (!formData.sourceOfFunds || !formData.occupationDetails || !formData.incomeProofFile)) {
         alert('Please complete financial details and upload your Income Proof.');
         return;
     }
     if (step === 5 && formData.selectedFunds.length === 0) {
         alert('Please select at least one fund and enter an investment amount.');
         return;
     }
     // Add more specific validation for each step as needed

    if (step < 6) { // Now 6 steps including summary
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if terms are accepted before submitting
    if (!termsAccepted && step === 6) {
        alert("Please accept the Terms and Conditions to submit.");
        return;
    }

    setIsSubmitting(true); // Start submission loading

    // Create FormData object to send files and other data
    const data = new FormData();

    // Append all form data fields
    for (const key in formData) {
      if (key !== 'govtIdFile' && key !== 'incomeProofFile' && key !== 'investmentsOwned' && key !== 'selectedFunds') {
        data.append(key, formData[key]);
      }
    }

    // Append array fields as JSON strings
    data.append('investmentsOwned', JSON.stringify(formData.investmentsOwned));
    data.append('selectedFunds', JSON.stringify(formData.selectedFunds));

    // Append file objects
    if (formData.govtIdFile) {
      data.append('govtIdFile', formData.govtIdFile);
    }
    if (formData.incomeProofFile) {
      data.append('incomeProofFile', formData.incomeProofFile);
    }

    // Append terms accepted as a string (backend expects 'true' or 'false')
    data.append('termsAccepted', termsAccepted ? 'true' : 'false');


    const token = localStorage.getItem('token'); // Get the token

    try {
      const response = await fetch('http://localhost:3001/api/onboarding', {
        method: 'POST',
        headers: {
          // 'Content-Type': 'multipart/form-data', // No need to set Content-Type for FormData - browser sets it
          'Authorization': `Bearer ${token}`, // Include the token
        },
        body: data, // Send the FormData object
      });

      // --- Improved Error Handling ---
      if (!response.ok) {
        // If response is not OK (e.g., 401, 403, 400, 500)
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            // Attempt to parse error response as JSON if Content-Type is application/json
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                 const errorData = await response.json();
                 errorMessage = errorData.error || errorMessage;
            } else {
                 // If not JSON, read as text
                 const errorText = await response.text();
                 errorMessage = `${errorMessage} - ${errorText}`;
            }
        } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
             // Fallback to just the status if parsing fails
             errorMessage = `HTTP error! status: ${response.status}`;
        }
        console.error('Onboarding submission failed:', errorMessage);
        alert(`Error submitting onboarding form: ${errorMessage}`);
        return; // Stop execution if response is not OK
      }
      // --- End Improved Error Handling ---


      const result = await response.json(); // Now safe to parse as JSON if response.ok

      console.log('Onboarding submission successful:', result);
      alert('Onboarding form submitted successfully!');
      // Redirect user to dashboard after successful submission
      navigate('/dashboard');

    } catch (error) {
      console.error('Onboarding fetch error:', error);
      alert('An error occurred during onboarding submission.');
    } finally {
      setIsSubmitting(false); // Stop submission loading
    }
  };

  // Handle PDF download
  const handleDownloadPdf = () => {
    const element = summaryRef.current;
     if (element) {
        // Use html2pdf library to generate PDF
        // Ensure the script tag for html2pdf.js is added to your public/index.html
        // Add some styling for the PDF if needed (e.g., print styles)
        const opt = {
          margin:       10,
          filename:     'onboarding_summary.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2 },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
     } else {
       console.error("Summary element not found for PDF generation.");
     }
  };


  // Render the current step's form section
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Section 1: Basic Details</h3>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
             <div>
              <label htmlFor="govtIdNumber" className="block text-sm font-medium text-gray-700">Govt ID Number</label>
              <input type="text" name="govtIdNumber" id="govtIdNumber" value={formData.govtIdNumber} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
             <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">Mobile</label>
              <input type="tel" name="mobile" id="mobile" value={formData.mobile} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Section 2: Investment Profile</h3>
            <div>
              <label htmlFor="timeHorizon" className="block text-sm font-medium text-gray-700">Time Horizon for Investment (in years)</label>
              <input type="number" name="timeHorizon" id="timeHorizon" value={formData.timeHorizon} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Risk Tolerance</label>
              <div className="mt-1 space-y-2">
                <div className="flex items-center">
                  <input id="risk-low" name="riskTolerance" type="radio" value="low" checked={formData.riskTolerance === 'low'} onChange={handleInputChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" />
                  <label htmlFor="risk-low" className="ml-2 block text-sm text-gray-900">Low</label>
                </div>
                 <div className="flex items-center">
                  <input id="risk-moderate" name="riskTolerance" type="radio" value="moderate" checked={formData.riskTolerance === 'moderate'} onChange={handleInputChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" />
                  <label htmlFor="risk-moderate" className="ml-2 block text-sm text-gray-900">Moderate</label>
                </div>
                 <div className="flex items-center">
                  <input id="risk-high" name="riskTolerance" type="radio" value="high" checked={formData.riskTolerance === 'high'} onChange={handleInputChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" />
                  <label htmlFor="risk-high" className="ml-2 block text-sm text-gray-900">High</label>
                </div>
              </div>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Kind of investments currently owned (Select all that apply)</label>
              <div className="mt-1 space-y-2">
                <div className="flex items-center">
                  <input id="inv-stocks" name="investmentsOwned" type="checkbox" value="stocks" checked={formData.investmentsOwned.includes('stocks')} onChange={handleInputChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                  <label htmlFor="inv-stocks" className="ml-2 block text-sm text-gray-900">Stocks</label>
                </div>
                 <div className="flex items-center">
                  <input id="inv-bonds" name="investmentsOwned" type="checkbox" value="bonds" checked={formData.investmentsOwned.includes('bonds')} onChange={handleInputChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                  <label htmlFor="inv-bonds" className="ml-2 block text-sm text-gray-900">Bonds</label>
                </div>
                 <div className="flex items-center">
                  <input id="inv-mutualfunds" name="investmentsOwned" type="checkbox" value="mutualfunds" checked={formData.investmentsOwned.includes('mutualfunds')} onChange={handleInputChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                  <label htmlFor="inv-mutualfunds" className="ml-2 block text-sm text-gray-900">Mutual Funds</label>
                </div>
                 <div className="flex items-center">
                  <input id="inv-realestate" name="investmentsOwned" type="checkbox" value="realestate" checked={formData.investmentsOwned.includes('realestate')} onChange={handleInputChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                  <label htmlFor="inv-realestate" className="ml-2 block text-sm text-gray-900">Real Estate</label>
                </div>
                 <div className="flex items-center">
                  <input id="inv-other" name="investmentsOwned" type="checkbox" value="other" checked={formData.investmentsOwned.includes('other')} onChange={handleInputChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                  <label htmlFor="inv-other" className="ml-2 block text-sm text-gray-900">Other</label>
                </div>
              </div>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Which of the following annual returns is acceptable to you?</label>
              <div className="mt-1 space-y-2">
                <div className="flex items-center">
                  <input id="return-5" name="acceptableAnnualReturn" type="radio" value="<5%" checked={formData.acceptableAnnualReturn === '<5%'} onChange={handleInputChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" />
                  <label htmlFor="return-5" className="ml-2 block text-sm text-gray-900">&lt; 5%</label>
                </div>
                 <div className="flex items-center">
                  <input id="return-5-10" name="acceptableAnnualReturn" type="radio" value="5-10%" checked={formData.acceptableAnnualReturn === '5-10%'} onChange={handleInputChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" />
                  <label htmlFor="return-5-10" className="ml-2 block text-sm text-gray-900">5-10%</label>
                </div>
                 <div className="flex items-center">
                  <input id="return-10-15" name="acceptableAnnualReturn" type="radio" value="10-15%" checked={formData.acceptableAnnualReturn === '10-15%'} onChange={handleInputChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" />
                  <label htmlFor="return-10-15" className="ml-2 block text-sm text-gray-900">10-15%</label>
                </div>
                 <div className="flex items-center">
                  <input id="return-15+" name="acceptableAnnualReturn" type="radio" value=">15%" checked={formData.acceptableAnnualReturn === '>15%'} onChange={handleInputChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" />
                  <label htmlFor="return-15+" className="ml-2 block text-sm text-gray-900">&gt; 15%</label>
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Section 3: Client Details</h3>
             <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input type="date" name="dob" id="dob" value={formData.dob} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
             <div>
              <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">Nationality</label>
              <input type="text" name="nationality" id="nationality" value={formData.nationality} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
             <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
              <textarea name="address" id="address" rows="3" value={formData.address} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
            </div>
             <div>
              <label htmlFor="clientType" className="block text-sm font-medium text-gray-700">Client Type (e.g., Employment)</label>
              <input type="text" name="clientType" id="clientType" value={formData.clientType} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="govtIdFile" className="block text-sm font-medium text-gray-700">Upload Govt ID (PDF)</label>
              <input type="file" name="govtIdFile" id="govtIdFile" accept=".pdf" onChange={handleInputChange} required className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              {formData.govtIdFile && <p className="mt-2 text-sm text-gray-500">Selected file: {formData.govtIdFile.name}</p>}
            </div>
             <div>
              <label htmlFor="contactDetails" className="block text-sm font-medium text-gray-700">Additional Contact Details</label>
              <input type="text" name="contactDetails" id="contactDetails" value={formData.contactDetails} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Section 4: Financial Details</h3>
             <div>
              <label htmlFor="sourceOfFunds" className="block text-sm font-medium text-gray-700">Source of Funds</label>
              <input type="text" name="sourceOfFunds" id="sourceOfFunds" value={formData.sourceOfFunds} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
             <div>
              <label htmlFor="occupationDetails" className="block text-sm font-medium text-gray-700">Occupation Details</label>
              <input type="text" name="occupationDetails" id="occupationDetails" value={formData.occupationDetails} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="incomeProofFile" className="block text-sm font-medium text-gray-700">Upload Income Proof (e.g., Salary Slip, Tax Return PDF)</label>
              <input type="file" name="incomeProofFile" id="incomeProofFile" accept=".pdf" onChange={handleInputChange} required className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
               {formData.incomeProofFile && <p className="mt-2 text-sm text-gray-500">Selected file: {formData.incomeProofFile.name}</p>}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Section 5: Choose Suitable Funds</h3>
            {availableFunds.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Based on your risk tolerance ({formData.riskTolerance}), here are some suitable funds:</p>
                {availableFunds.map(fund => (
                  <div key={fund.id} className="border p-4 rounded-md space-y-2">
                    <h4 className="text-lg font-medium text-gray-700">{fund.name}</h4>
                    <p className="text-sm text-gray-600">{fund.description}</p>
                    <div>
                      <label htmlFor={`fund-${fund.id}-amount`} className="block text-sm font-medium text-gray-700">Amount to Invest ($)</label>
                      <input
                        type="number"
                        id={`fund-${fund.id}-amount`}
                        value={formData.selectedFunds.find(sf => sf.id === fund.id)?.amount || ''}
                        onChange={(e) => handleFundSelectionChange(fund.id, e.target.value)}
                        min="0"
                        step="100"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                     {formData.selectedFunds.some(sf => sf.id === fund.id) && (
                        <p className="text-sm text-green-600">Selected: ${formData.selectedFunds.find(sf => sf.id === fund.id)?.amount}</p>
                     )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">Please select your risk tolerance in the previous step to see suitable funds.</p>
            )}
          </div>
        );
      case 6: // Summary Page
          return (
            <div className="space-y-6" ref={summaryRef}> {/* Attach ref here */}
                <h3 className="text-xl font-semibold text-gray-800">Section 6: Summary and Confirmation</h3>
                <p className="text-gray-600">Please review your details before submitting.</p>

                {/* Display Summary Details */}
                <div className="border p-4 rounded-md space-y-4 text-sm text-gray-700">
                    <h4 className="text-lg font-medium text-gray-800 border-b pb-2">Basic Details</h4>
                    <p><strong>Full Name:</strong> {formData.fullName}</p>
                    <p><strong>Govt ID Number:</strong> {formData.govtIdNumber}</p>
                    <p><strong>Mobile:</strong> {formData.mobile}</p>
                    <p><strong>Email:</strong> {formData.email}</p>

                    <h4 className="text-lg font-medium text-gray-800 border-b pb-2 mt-4">Investment Profile</h4>
                    <p><strong>Time Horizon:</strong> {formData.timeHorizon} years</p>
                    <p><strong>Risk Tolerance:</strong> {formData.riskTolerance}</p>
                    <p><strong>Investments Owned:</strong> {formData.investmentsOwned.join(', ') || 'None selected'}</p>
                    <p><strong>Acceptable Annual Return:</strong> {formData.acceptableAnnualReturn}</p>

                    <h4 className="text-lg font-medium text-gray-800 border-b pb-2 mt-4">Client Details</h4>
                    <p><strong>Date of Birth:</strong> {formData.dob}</p>
                    <p><strong>Nationality:</strong> {formData.nationality}</p>
                    <p><strong>Address:</strong> {formData.address}</p>
                    <p><strong>Client Type:</strong> {formData.clientType}</p>
                    <p><strong>Govt ID File:</strong> {formData.govtIdFile ? formData.govtIdFile.name : 'No file uploaded'}</p>
                    <p><strong>Additional Contact Details:</strong> {formData.contactDetails || 'N/A'}</p>

                    <h4 className="text-lg font-medium text-gray-800 border-b pb-2 mt-4">Financial Details</h4>
                    <p><strong>Source of Funds:</strong> {formData.sourceOfFunds}</p>
                    <p><strong>OccupationDetails:</strong> {formData.occupationDetails}</p>
                    <p><strong>Income Proof File:</strong> {formData.incomeProofFile ? formData.incomeProofFile.name : 'No file uploaded'}</p>

                     <h4 className="text-lg font-medium text-gray-800 border-b pb-2 mt-4">Selected Funds</h4>
                     {formData.selectedFunds.length > 0 ? (
                       <ul className="space-y-2">
                         {formData.selectedFunds.map(fund => (
                           <li key={fund.id}>
                             {fund.name}: ${fund.amount}
                           </li>
                         ))}
                       </ul>
                     ) : (
                       <p>No funds selected.</p>
                     )}
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start mt-6">
                    <input
                        id="terms-and-conditions"
                        name="terms-and-conditions"
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded mt-1"
                    />
                    <label htmlFor="terms-and-conditions" className="ml-2 block text-sm text-gray-900">
                        I agree to the <a href="#" className="text-indigo-600 hover:text-indigo-500">Terms and Conditions</a>. (Placeholder link)
                    </label>
                </div>

                 {/* PDF Download Button */}
                 <button
                     type="button"
                     onClick={handleDownloadPdf}
                     className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                 >
                     Download Summary as PDF
                 </button>

            </div>
          );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 text-center">Client Onboarding</h2>

      {/* Progress Indicator */}
      <div className="flex justify-between text-sm text-gray-600">
        {[1, 2, 3, 4, 5, 6].map(s => (
          <span key={s} className={`font-semibold ${step === s ? 'text-indigo-600' : step < s ? 'text-gray-400' : 'text-green-600'}`}> {/* Added visual for completed steps */}
            Step {s}
          </span>
        ))}
      </div>
       <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${(step / 6) * 100}%` }}></div> {/* Updated to 6 steps */}
        </div>


      <form onSubmit={handleSubmit} className="space-y-6">
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isSubmitting} // Disable while submitting
            >
              Previous
            </button>
          )}


          {step < 6 && (
            <button
              type="button"
              onClick={nextStep}
              className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${step === 1 ? 'ml-auto' : ''} disabled:opacity-50 disabled:cursor-not-allowed`} // Align right if only next button
              disabled={isSubmitting} // Disable while submitting
            >
              Next
            </button>
          )}

          {step === 6 && (
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ml-auto disabled:opacity-50 disabled:cursor-not-allowed" // Added disabled styles
              disabled={!termsAccepted || isSubmitting} // Disabled until terms are accepted or while submitting
            >
              {isSubmitting ? 'Submitting...' : 'Submit Onboarding'} {/* Show loading text */}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
