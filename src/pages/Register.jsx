
// import React, { useEffect, useState, useCallback, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import FormHeader from "../components/FormHeader";
// import HeroHeading from "../components/HeroHeading";
// import FormField from "../components/FormField";
// import FormPassword from "../components/FormPassword";
// import FormFooter from "../components/FormFooter";
// import { Link } from "react-router-dom";
// import FormImg from "../components/FormImg";
// import ProcessWrapper from "../components/ProcessWrapper";
// import { validateEmailAPI } from "../services/user.service";

// function Register() {
//   const [fields, setFields] = useState(() => {
//     const saved = sessionStorage.getItem("registerFields");
//     const parsed = saved ? JSON.parse(saved) : null;

//     return parsed
//       ? {
//           fullName: parsed.fullName || "",
//           email: parsed.email || "",
//           password: "",
//           confirmPassword: "",
//         }
//       : {
//           fullName: "",
//           email: "",
//           password: "",
//           confirmPassword: "",
//         };
//   });

//   const [touched, setTouched] = useState({
//     fullName: false,
//     email: false,
//     password: false,
//     confirmPassword: false,
//   });

//   const [errors, setErrors] = useState({
//     fullName: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//   });

//   // Email validation specific states
//   const [isEmailValidating, setIsEmailValidating] = useState(false);
//   const [emailApiValidated, setEmailApiValidated] = useState(false);
//   const [lastValidatedEmail, setLastValidatedEmail] = useState("");

//   const [checkboxChecked, setCheckboxChecked] = useState(false);
//   const [checkboxMessage, setCheckboxMessage] = useState("");
//   const [checkboxMessageType, setCheckboxMessageType] = useState("");

//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   // Refs for debouncing and abort controller
//   const emailDebounceTimer = useRef(null);
//   const abortController = useRef(null);

//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//   const passwordChecks = [
//     { test: (v) => v.length >= 8, message: "At least 8 characters" },
//     { test: (v) => /[A-Z]/.test(v), message: "At least one uppercase letter" },
//     { test: (v) => /[a-z]/.test(v), message: "At least one lowercase letter" },
//     { test: (v) => /[0-9]/.test(v), message: "At least one number" },
//     { test: (v) => /[^A-Za-z0-9]/.test(v), message: "At least one special character" },
//   ];

//   // Email API validation function
//   const validateEmailWithAPI = useCallback(async (email) => {
//     // Clear previous timer
//     if (emailDebounceTimer.current) {
//       clearTimeout(emailDebounceTimer.current);
//     }

//     // Abort previous request
//     if (abortController.current) {
//       abortController.current.abort();
//     }

//     // Basic format check first
//     if (!email || !emailRegex.test(email)) {
//       setIsEmailValidating(false);
//       setEmailApiValidated(false);
//       setLastValidatedEmail("");
//       return;
//     }

//     // If already validated this email, skip API call
//     if (lastValidatedEmail === email && emailApiValidated) {
//       return;
//     }

//     setIsEmailValidating(true);

//     // Debounce API call by 800ms
//     emailDebounceTimer.current = setTimeout(async () => {
//       try {
//         abortController.current = new AbortController();
        
//         const response = await validateEmailAPI(email, {
//           signal: abortController.current.signal
//         });
        
//         // API success means email is available
//         if (response.success || response.available) {
//           setErrors(prev => ({ ...prev, email: "Email is available" }));
//           setEmailApiValidated(true);
//           setLastValidatedEmail(email);
//         } else {
//           setErrors(prev => ({ ...prev, email: "This email is already registered" }));
//           setEmailApiValidated(false);
//           setLastValidatedEmail(email);
//         }
//       } catch (error) {
//         // Handle different types of errors
//         if (error.name === 'AbortError') {
//           return; // Request was aborted, ignore
//         }
        
//         if (error.response?.status === 409 || error.response?.data?.message?.includes('already')) {
//           setErrors(prev => ({ ...prev, email: "This email is already registered" }));
//           setEmailApiValidated(false);
//         } else {
//           // Network error or other issues - don't block the user
//           console.error("Email validation error:", error);
//           setErrors(prev => ({ ...prev, email: "Unable to verify email, please try again" }));
//           setEmailApiValidated(false);
//         }
//         setLastValidatedEmail(email);
//       } finally {
//         setIsEmailValidating(false);
//       }
//     }, 800); // 800ms debounce
//   }, [emailRegex, lastValidatedEmail, emailApiValidated]);

//   const validateField = (name, value) => {
//     let msg = "This field is required";
//     if (!value) return setErrors((prev) => ({ ...prev, [name]: msg }));

//     switch (name) {
//       case "email":
//         if (!emailRegex.test(value)) {
//           msg = "Enter a valid email";
//           setEmailApiValidated(false);
//           setLastValidatedEmail("");
//         } else {
//           // Start API validation for valid format emails
//           validateEmailWithAPI(value);
          
//           // Show appropriate message based on current state
//           if (value === lastValidatedEmail) {
//             msg = emailApiValidated ? "Email is available" : errors.email || "Email is valid";
//           } else {
//             msg = "Email is valid";
//           }
//         }
//         break;
//       case "password":
//         const failed = passwordChecks.find((check) => !check.test(value));
//         msg = failed ? failed.message : "Password is strong";
//         break;
//       case "confirmPassword":
//         msg = value === fields.password ? "Password matched" : "Passwords do not match";
//         break;
//       case "fullName":
//         msg = value.trim().length > 1 ? "Full Name is valid" : "This field is required";
//         break;
//       default:
//         break;
//     }

//     setErrors((prev) => ({ ...prev, [name]: msg }));
//   };

//   useEffect(() => {
//     const ttlStart = sessionStorage.getItem("ttlStartTime");
//     if (!ttlStart) sessionStorage.setItem("ttlStartTime", Date.now());

//     Object.entries(fields).forEach(([name, value]) => {
//       if (value) {
//         setTouched((prev) => ({ ...prev, [name]: true }));
//         validateField(name, value);
//       }
//     });

//     // Cleanup on unmount
//     return () => {
//       if (emailDebounceTimer.current) {
//         clearTimeout(emailDebounceTimer.current);
//       }
//       if (abortController.current) {
//         abortController.current.abort();
//       }
//     };
//   }, []);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFields((prev) => ({ ...prev, [name]: value }));
//     setTouched((prev) => ({ ...prev, [name]: true }));
    
//     // Reset email validation state when email changes
//     if (name === "email" && value !== lastValidatedEmail) {
//       setEmailApiValidated(false);
//       setIsEmailValidating(false);
//     }
    
//     validateField(name, value);
//   };

//   const handleBlur = async (e) => {
//     const { name, value } = e.target;
//     setTouched((prev) => ({ ...prev, [name]: true }));
//     validateField(name, value);

//     // Force email validation on blur if format is valid
//     if (name === "email" && emailRegex.test(value) && value !== lastValidatedEmail) {
//       await validateEmailWithAPI(value);
//     }
//   };

//   const isValid = {
//     fullName: errors.fullName === "Full Name is valid",
//     email: (errors.email === "Email is available") && emailApiValidated,
//     password: errors.password === "Password is strong",
//     confirmPassword: errors.confirmPassword === "Password matched",
//   };

//   const allFieldsValid =
//     Object.values(isValid).every(Boolean) &&
//     Object.values(fields).every((val) => val.trim().length > 0) &&
//     !isEmailValidating; // Don't allow submit while validating

//   const checkboxDisabled = !allFieldsValid;

//   const handleCheckboxChange = (e) => {
//     const checked = e.target.checked;
//     setCheckboxChecked(checked);
//     setCheckboxMessage(checked ? "" : "Please accept all terms");
//     setCheckboxMessageType(checked ? "" : "error");
//   };

//   const handleNext = async (e) => {
//     e.preventDefault();

//     const newTouched = { ...touched };
//     const newErrors = { ...errors };
//     let valid = true;

//     // Validate all fields
//     Object.entries(fields).forEach(([key, value]) => {
//       newTouched[key] = true;
//       if (!value) {
//         newErrors[key] = "This field is required";
//         valid = false;
//       } else {
//         validateField(key, value);
//         if (
//           (key === "email" && (!emailRegex.test(value) || !emailApiValidated)) ||
//           (key === "password" && passwordChecks.some((c) => !c.test(value))) ||
//           (key === "confirmPassword" && value !== fields.password)
//         ) {
//           valid = false;
//         }
//       }
//     });

//     setTouched(newTouched);
//     setErrors(newErrors);

//     // Check if email is still being validated
//     if (isEmailValidating) {
//       setErrors(prev => ({ ...prev, email: "Please wait, validating email..." }));
//       return;
//     }

//     // Final email validation check
//     if (emailRegex.test(fields.email) && fields.email !== lastValidatedEmail) {
//       setErrors(prev => ({ ...prev, email: "Please wait, validating email..." }));
//       await validateEmailWithAPI(fields.email);
//       return; // Let the user try again after validation
//     }

//     if (!checkboxChecked) {
//       setCheckboxMessage("Please accept all terms");
//       setCheckboxMessageType("error");
//       return;
//     }

//     if (valid && checkboxChecked && emailApiValidated) {
//       const filteredFields = Object.fromEntries(
//         Object.entries(fields).filter(([key]) => key !== "password" && key !== "confirmPassword")
//       );

//       sessionStorage.setItem("registerFields", JSON.stringify(filteredFields));
//       navigate("/company-build", {
//         state: {
//           fullName: fields.fullName,
//           email: fields.email,
//           password: fields.password,
//         },
//       });
//     }
//   };

//   const data = {
//     title: "Ready to Win More Contracts?",
//     para: "All government bids. One dashboard. Zero hassles.",
//     btnText: false,
//     btnLink: false,
//     container: "max-w-4xl mx-auto text-left",
//     headingSize: "h3",
//     pSize: "text-xl",
//   };

//   const formHeader = {
//     title: "Log In",
//     link: "/login",
//     steps: 6,
//     activeStep: 0,
//   };

//   const formFooter = {
//     back: { text: "Back", link: "/login" },
//     next: { text: "Next", link: "/company-build" },
//     skip: { text: "", link: "" },
//   };

//   // Helper function to get email message with loading state
//   const getEmailMessage = () => {
//     if (!touched.email || !errors.email) return "";
    
//     let iconClass = "fa-xmark text-red-400";
//     let textColor = "text-red-400";
    
//     if (isEmailValidating) {
//       iconClass = "fa-spinner fa-spin text-blue-400";
//       textColor = "text-blue-400";
//     } else if (isValid.email) {
//       iconClass = "fa-circle-check text-green-400";
//       textColor = "text-green-400";
//     }

//     return (
//       <span className={`flex items-center gap-1 mt-0.5 mb-1 ${textColor}`}>
//         <i className={`fa-solid ${iconClass}`}></i>
//         <span>{isEmailValidating ? "Checking email availability..." : errors.email}</span>
//       </span>
//     );
//   };

//   return (
//     <ProcessWrapper>
//       <div className="form-left">
//         <div className="pe-3 flex flex-col justify-between h-full">
//           <div>
//             <FormHeader {...formHeader} />
//             <HeroHeading data={data} />
//           </div>
//           <form className="form-container flex flex-col h-full justify-between">
//             <div>
//               {/* Full Name */}
//               <FormField
//                 label="Full Name"
//                 type="text"
//                 name="fullName"
//                 placeholder="e.g. John Doe"
//                 delay={100}
//                 value={fields.fullName}
//                 onChange={handleChange}
//                 onBlur={handleBlur}
//                 message={
//                   touched.fullName && errors.fullName ? (
//                     <span className={`flex items-center gap-1 mt-0.5 mb-1 ${isValid.fullName ? "text-green-400" : "text-red-400"}`}>
//                       <i className={`fa-solid ${isValid.fullName ? "fa-circle-check text-green-400" : "fa-xmark text-red-400"}`}></i>
//                       <span>{errors.fullName}</span>
//                     </span>
//                   ) : ""
//                 }
//                 messageType={touched.fullName && (isValid.fullName ? "success" : errors.fullName ? "error" : "")}
//               />

//               {/* Email with API Validation */}
//               <FormField
//                 label="Email"
//                 type="email"
//                 name="email"
//                 placeholder="e.g. jopseph.mark12@gmail.com"
//                 delay={100}
//                 value={fields.email}
//                 onChange={handleChange}
//                 onBlur={handleBlur}
//                 message={getEmailMessage()}
//                 messageType={
//                   touched.email && 
//                   (isEmailValidating ? "loading" : 
//                    isValid.email ? "success" : 
//                    errors.email ? "error" : "")
//                 }
//               />

//               {/* Password */}
//               <FormPassword
//                 label="Password"
//                 placeholder="e.g. m@rkJos6ph"
//                 name="password"
//                 id="password"
//                 delay={100}
//                 value={fields.password}
//                 onChange={handleChange}
//                 onBlur={handleBlur}
//                 message={
//                   touched.password && errors.password ? (
//                     <span className={`flex items-center gap-1 mt-0.5 mb-1 ${isValid.password ? "text-green-400" : "text-red-400"}`}>
//                       <i className={`fa-solid ${isValid.password ? "fa-circle-check text-green-400" : "fa-xmark text-red-400"}`}></i>
//                       <span>{errors.password}</span>
//                     </span>
//                   ) : ""
//                 }
//                 messageType={touched.password && (isValid.password ? "success" : errors.password ? "error" : "")}
//               />

//               {/* Confirm Password */}
//               <FormPassword
//                 label="Confirm password"
//                 placeholder="e.g. m@rkJos6ph"
//                 name="confirmPassword"
//                 id="confirmPassword"
//                 delay={100}
//                 value={fields.confirmPassword}
//                 onChange={handleChange}
//                 onBlur={handleBlur}
//                 message={
//                   touched.confirmPassword && errors.confirmPassword ? (
//                     <span className={`flex items-center gap-1 mt-0.5 mb-1 ${isValid.confirmPassword ? "text-green-400" : "text-red-400"}`}>
//                       <i className={`fa-solid ${isValid.confirmPassword ? "fa-circle-check text-green-400" : "fa-xmark text-red-400"}`}></i>
//                       <span>{errors.confirmPassword}</span>
//                     </span>
//                   ) : ""
//                 }
//                 messageType={touched.confirmPassword && (isValid.confirmPassword ? "success" : errors.confirmPassword ? "error" : "")}
//               />
//             </div>

//             <div>
//               <div className="accept">
//                 <label className="text-white font-t font-normal">
//                   <input
//                     type="checkbox"
//                     className="mr-2"
//                     disabled={checkboxDisabled}
//                     checked={checkboxChecked}
//                     onChange={handleCheckboxChange}
//                   />
//                   I accept the&nbsp;
//                   <Link className="underline" to="/policy">Privacy Policy</Link>,&nbsp;
//                   <Link className="underline" to="/terms">T&C</Link>,&nbsp;
//                   <Link className="underline" to="/member-terms">Member Terms</Link>,&nbsp;
//                   <Link className="underline" to="/disclaimer">Disclaimer</Link>.
//                 </label>

//                 {checkboxMessage && (
//                   <p className={`text-sm flex items-center gap-1 mt-0.5 mb-1 ${checkboxMessageType === "success" ? "text-green-400" : "text-red-400"}`}>
//                     <i className={`fa-solid ${checkboxMessageType === "success" ? "fa-circle-check text-green-400" : "fa-xmark text-red-400"}`}></i>
//                     <span>{checkboxMessage}</span>
//                   </p>
//                 )}
//               </div>

//               <FormFooter 
//                 data={formFooter} 
//                 onNextClick={handleNext}
//                 disabled={!allFieldsValid || isEmailValidating}
//               />
//             </div>
//           </form>
//         </div>
//       </div>
//       <div className="sticky top-0">
//         <FormImg src={"login-img.png"} />
//       </div>
//     </ProcessWrapper>
//   );
// }

// export default Register;





import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import FormHeader from "../components/FormHeader";
import HeroHeading from "../components/HeroHeading";
import FormField from "../components/FormField";
import FormPassword from "../components/FormPassword";
import FormFooter from "../components/FormFooter";
import { Link } from "react-router-dom";
import FormImg from "../components/FormImg";
import ProcessWrapper from "../components/ProcessWrapper";
import { validateEmailAPI } from "../services/user.service";


function Register() {
  const [fields, setFields] = useState(() => {
    const saved = sessionStorage.getItem("registerFields");
    const parsed = saved ? JSON.parse(saved) : null;

    return parsed
      ? {
          fullName: parsed.fullName || "",
          email: parsed.email || "",
          password: "",
          confirmPassword: "",
        }
      : {
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
        };
  });

  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Email validation specific states
  const [isEmailValidating, setIsEmailValidating] = useState(false);
  const [emailApiValidated, setEmailApiValidated] = useState(false);
  const [lastValidatedEmail, setLastValidatedEmail] = useState("");

  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [checkboxMessage, setCheckboxMessage] = useState("");
  const [checkboxMessageType, setCheckboxMessageType] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Refs for debouncing and abort controller
  const emailDebounceTimer = useRef(null);
  const abortController = useRef(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const passwordChecks = [
    { test: (v) => v.length >= 8, message: "At least 8 characters" },
    { test: (v) => /[A-Z]/.test(v), message: "At least one uppercase letter" },
    { test: (v) => /[a-z]/.test(v), message: "At least one lowercase letter" },
    { test: (v) => /[0-9]/.test(v), message: "At least one number" },
    { test: (v) => /[^A-Za-z0-9]/.test(v), message: "At least one special character" },
  ];

  // Email API validation function
  const validateEmailWithAPI = useCallback(async (email) => {
    // Clear previous timer
    if (emailDebounceTimer.current) {
      clearTimeout(emailDebounceTimer.current);
    }

    // Abort previous request
    if (abortController.current) {
      abortController.current.abort();
    }

    // Basic format check first
    if (!email || !emailRegex.test(email)) {
      setIsEmailValidating(false);
      setEmailApiValidated(false);
      setLastValidatedEmail("");
      return;
    }

    // If already validated this email, skip API call
    if (lastValidatedEmail === email && emailApiValidated) {
      return;
    }

    setIsEmailValidating(true);

    // Debounce API call by 800ms
    emailDebounceTimer.current = setTimeout(async () => {
      try {
        abortController.current = new AbortController();
        
        const response = await validateEmailAPI(email, {
          signal: abortController.current.signal
        });
        
        // API success means email is available
        if (response.success || response.available) {
          setErrors(prev => ({ ...prev, email: "Email is Valid" }));
          setEmailApiValidated(true);
          setLastValidatedEmail(email);
        } else {
          setErrors(prev => ({ ...prev, email: "This email is already registered" }));
          setEmailApiValidated(false);
          setLastValidatedEmail(email);
        }
      } catch (error) {
        // Handle different types of errors
        if (error.name === 'AbortError') {
          return; // Request was aborted, ignore
        }
        
        if (error.response?.status === 409 || error.response?.data?.message?.includes('already')) {
          setErrors(prev => ({ ...prev, email: "This email is already registered" }));
          setEmailApiValidated(false);
        } else {
          // Network error or other issues - don't block the user
          console.error("Email validation error:", error);
          setErrors(prev => ({ ...prev, email: "Unable to verify email, please try again" }));
          setEmailApiValidated(false);
        }
        setLastValidatedEmail(email);
      } finally {
        setIsEmailValidating(false);
      }
    }, 800); // 800ms debounce
  }, [emailRegex, lastValidatedEmail, emailApiValidated]);

  const validateField = (name, value) => {
    let msg = "This field is required";
    if (!value) return setErrors((prev) => ({ ...prev, [name]: msg }));

    switch (name) {
      case "email":
        if (!emailRegex.test(value)) {
          msg = "Enter a valid email";
          setEmailApiValidated(false);
          setLastValidatedEmail("");
        } else {
          // Start API validation for valid format emails
          validateEmailWithAPI(value);
          
          // Show appropriate message based on current state
          if (value === lastValidatedEmail) {
            msg = emailApiValidated ? "Email is Valid" : errors.email || "Email is valid";
          } else {
            msg = "Email is valid";
          }
        }
        break;
      case "password":
        const failed = passwordChecks.find((check) => !check.test(value));
        msg = failed ? failed.message : "Password is strong";
        break;
      case "confirmPassword":
        msg = value === fields.password ? "Password matched" : "Passwords do not match";
        break;
      case "fullName":
        msg = value.trim().length > 1 ? "Full Name is valid" : "This field is required";
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: msg }));
  };

  // Add this useEffect back in your Register component (uncomment and fix it):

useEffect(() => {
  // Validate pre-filled fields and set them as touched
  Object.entries(fields).forEach(([name, value]) => {
    if (value && value.trim().length > 0) {
      setTouched((prev) => ({ ...prev, [name]: true }));
      validateField(name, value);
    }
  });

  // Cleanup on unmount 
  return () => {
    if (emailDebounceTimer.current) {
      clearTimeout(emailDebounceTimer.current);
    }
    if (abortController.current) {
      abortController.current.abort();
    }
  };
}, []); // Empty dependency array - run only on mount

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    // Reset email validation state when email changes
    if (name === "email" && value !== lastValidatedEmail) {
      setEmailApiValidated(false);
      setIsEmailValidating(false);
    }
    
    validateField(name, value);
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);

    // Force email validation on blur if format is valid
    if (name === "email" && emailRegex.test(value) && value !== lastValidatedEmail) {
      await validateEmailWithAPI(value);
    }
  };

  const isValid = {
    fullName: errors.fullName === "Full Name is valid",
    email: (errors.email === "Email is Valid") && emailApiValidated,
    password: errors.password === "Password is strong",
    confirmPassword: errors.confirmPassword === "Password matched",
  };

  const allFieldsValid =
    Object.values(isValid).every(Boolean) &&
    Object.values(fields).every((val) => val.trim().length > 0) &&
    !isEmailValidating; // Don't allow submit while validating

  const checkboxDisabled = !allFieldsValid;

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setCheckboxChecked(checked);
    setCheckboxMessage(checked ? "" : "Please accept all terms");
    setCheckboxMessageType(checked ? "" : "error");
  };

  const handleNext = async (e) => {
    e.preventDefault();

    const newTouched = { ...touched };
    const newErrors = { ...errors };
    let valid = true;

    // Validate all fields
    Object.entries(fields).forEach(([key, value]) => {
      newTouched[key] = true;
      if (!value) {
        newErrors[key] = "This field is required";
        valid = false;
      } else {
        validateField(key, value);
        if (
          (key === "email" && (!emailRegex.test(value) || !emailApiValidated)) ||
          (key === "password" && passwordChecks.some((c) => !c.test(value))) ||
          (key === "confirmPassword" && value !== fields.password)
        ) {
          valid = false;
        }
      }
    });

    setTouched(newTouched);
    setErrors(newErrors);

    // Check if email is still being validated
    if (isEmailValidating) {
      setErrors(prev => ({ ...prev, email: "Please wait, validating email..." }));
      return;
    }

    // Final email validation check
    if (emailRegex.test(fields.email) && fields.email !== lastValidatedEmail) {
      setErrors(prev => ({ ...prev, email: "Please wait, validating email..." }));
      await validateEmailWithAPI(fields.email);
      return; // Let the user try again after validation
    }

    if (!checkboxChecked) {
      setCheckboxMessage("Please accept all terms");
      setCheckboxMessageType("error");
      return;
    }

    if (valid && checkboxChecked && emailApiValidated) {
      const filteredFields = Object.fromEntries(
        Object.entries(fields).filter(([key]) => key !== "password" && key !== "confirmPassword")
      );

      sessionStorage.setItem("registerFields", JSON.stringify(filteredFields));
      navigate("/company-build", {
        state: {
          fullName: fields.fullName,
          email: fields.email,
          password: fields.password,
        },
      });
    }
  };

  const data = {
    title: "Ready to Win More Contracts?",
    para: "All government bids. One dashboard. Zero hassles.",
    btnText: false,
    btnLink: false,
    container: "max-w-4xl mx-auto text-left",
    headingSize: "h3",
    pSize: "text-xl",
  };

  const formHeader = {
    title: "Log In",
    link: "/login",
    steps: 6,
    activeStep: 0,
  };

  const formFooter = {
    back: { text: "Back", link: "/login" },
    next: { text: "Next", link: "/company-build" },
    skip: { text: "", link: "" },
  };

  // Helper function to get email message with loading state
  const getEmailMessage = () => {
    if (!touched.email || !errors.email) return "";
    
    let iconClass = "fa-xmark text-red-400";
    let textColor = "text-red-400";
    
    if (isEmailValidating) {
      iconClass = "fa-spinner fa-spin text-blue-400";
      textColor = "text-blue-400";
      // Only show spinner and message when validating, no cross icon
      return (
        <span className={`flex items-center gap-1 mt-0.5 mb-1 ${textColor}`}>
          {/* <i className={`fa-solid ${iconClass}`}></i> */}
          <span>Checking email availability...</span>
        </span>
      );
    } else if (isValid.email) {
      iconClass = "fa-circle-check text-green-400";
      textColor = "text-green-400";
    }

    return (
      <span className={`flex items-center gap-1 mt-0.5 mb-1 ${textColor}`}>
        <i className={`fa-solid ${iconClass}`}></i>
        <span>{errors.email}</span>
      </span>
    );
  };

  return (
    <ProcessWrapper>
      <div className="form-left">
        <div className="pe-3 flex flex-col justify-between h-full">
          <div>
            <FormHeader {...formHeader} />
            <HeroHeading data={data} />
          </div>
          <form className="form-container flex flex-col h-full justify-between">
            <div>
              {/* Full Name */}
              <FormField
                label="Full Name *"
                type="text"
                name="fullName"
                placeholder="e.g. John Doe"
                delay={100}
                value={fields.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                message={
                  touched.fullName && errors.fullName ? (
                    <span className={`flex items-center gap-1 mt-0.5 mb-1 ${isValid.fullName ? "text-green-400" : "text-red-400"}`}>
                      <i className={`fa-solid ${isValid.fullName ? "fa-circle-check text-green-400" : "fa-xmark text-red-400"}`}></i>
                      <span>{errors.fullName}</span>
                    </span>
                  ) : ""
                }
                messageType={touched.fullName && (isValid.fullName ? "success" : errors.fullName ? "error" : "")}
              />

              {/* Email with API Validation */}
              <FormField
                label="Email *"
                type="email"
                name="email"
                placeholder="e.g. jopseph.mark12@gmail.com"
                delay={100}
                value={fields.email}
                onChange={handleChange}
                onBlur={handleBlur}
                message={getEmailMessage()}
                messageType={
                  touched.email && 
                  (isEmailValidating ? "loading" : 
                   isValid.email ? "success" : 
                   errors.email ? "error" : "")
                }
              />

              {/* Password */}
              <FormPassword
                label="Password *"
                placeholder="e.g. m@rkJos6ph"
                name="password"
                id="password"
                delay={100}
                value={fields.password}
                onChange={handleChange}
                onBlur={handleBlur}
                message={
                  touched.password && errors.password ? (
                    <span className={`flex items-center gap-1 mt-0.5 mb-1 ${isValid.password ? "text-green-400" : "text-red-400"}`}>
                      <i className={`fa-solid ${isValid.password ? "fa-circle-check text-green-400" : "fa-xmark text-red-400"}`}></i>
                      <span>{errors.password}</span>
                    </span>
                  ) : ""
                }
                messageType={touched.password && (isValid.password ? "success" : errors.password ? "error" : "")}
              />

              {/* Confirm Password */}
              <FormPassword
                label="Confirm password *"
                placeholder="e.g. m@rkJos6ph"
                name="confirmPassword"
                id="confirmPassword"
                delay={100}
                value={fields.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                message={
                  touched.confirmPassword && errors.confirmPassword ? (
                    <span className={`flex items-center gap-1 mt-0.5 mb-1 ${isValid.confirmPassword ? "text-green-400" : "text-red-400"}`}>
                      <i className={`fa-solid ${isValid.confirmPassword ? "fa-circle-check text-green-400" : "fa-xmark text-red-400"}`}></i>
                      <span>{errors.confirmPassword}</span>
                    </span>
                  ) : ""
                }
                messageType={touched.confirmPassword && (isValid.confirmPassword ? "success" : errors.confirmPassword ? "error" : "")}
              />
            </div>

            <div>
              <div className="accept">
                <label className="text-white font-t font-normal">
                  <input
                    type="checkbox"
                    className="mr-2"
                    disabled={checkboxDisabled}
                    checked={checkboxChecked}
                    onChange={handleCheckboxChange}
                  />
                  I accept the&nbsp;
                  <Link className="underline" target="_blank" to="/policy">Privacy Policy</Link>,&nbsp;
                  <Link className="underline" target="_blank" to="/terms">T&C</Link>,&nbsp;
                  <Link className="underline" target="_blank" to="/member-terms">Member Terms</Link>,&nbsp;
                  <Link className="underline" target="_blank" to="/disclaimer">Disclaimer</Link>.
                </label>

                {checkboxMessage && (
                  <p className={`text-sm flex items-center gap-1 mt-0.5 mb-1 ${checkboxMessageType === "success" ? "text-green-400" : "text-red-400"}`}>
                    <i className={`fa-solid ${checkboxMessageType === "success" ? "fa-circle-check text-green-400" : "fa-xmark text-red-400"}`}></i>
                    <span>{checkboxMessage}</span>
                  </p>
                )}
              </div>

              <FormFooter 
                data={formFooter} 
                onNextClick={handleNext}
                disabled={!allFieldsValid || isEmailValidating}
              />
            </div>
          </form>
        </div>
      </div>
      <div className="sticky top-0">
        <FormImg src={"loginbid.png"} />
      </div>
    </ProcessWrapper>
  );
}

export default Register;