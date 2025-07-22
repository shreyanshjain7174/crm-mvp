'use client';

import React, { useState } from 'react';
import { X, Shield, Star, Download, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import type { AgentManifest } from '../../types/agent-types';

interface AgentInstallModalProps {
  agent: AgentManifest;
  isOpen: boolean;
  onClose: () => void;
}

type InstallStep = 'permissions' | 'config' | 'installing' | 'success';

export function AgentInstallModal({ agent, isOpen, onClose }: AgentInstallModalProps) {
  const [currentStep, setCurrentStep] = useState<InstallStep>('permissions');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [config, setConfig] = useState<Record<string, any>>({});

  if (!isOpen) return null;

  const handleInstall = async () => {
    setCurrentStep('installing');
    
    // Simulate installation process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setCurrentStep('success');
  };

  const handleClose = () => {
    setCurrentStep('permissions');
    setAgreedToTerms(false);
    setConfig({});
    onClose();
  };

  const formatPermissionName = (permission: string) => {
    const [resource, action] = permission.split(':');
    return `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`;
  };

  const getPermissionIcon = (permission: string) => {
    if (permission.includes('write')) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return <Shield className="w-4 h-4 text-blue-500" />;
  };

  const getPermissionRisk = (permission: string) => {
    if (permission.includes('write')) return 'Medium';
    return 'Low';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                {agent.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={agent.icon} alt={agent.name} className="w-6 h-6" />
                ) : (
                  <span className="text-lg">🤖</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Install {agent.name}</h3>
                <p className="text-sm text-gray-500">{agent.provider.name}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {currentStep === 'permissions' && (
              <div className="space-y-6">
                {/* Agent Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">About this agent</h4>
                  <p className="text-sm text-gray-600 mb-4">{agent.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1 fill-current" />
                      {agent.rating || 4.5} ({agent.reviews || '1.2k'} reviews)
                    </div>
                    <div className="flex items-center">
                      <Download className="w-4 h-4 mr-1" />
                      {agent.installs || '10k+'} installs
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Permissions Required</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {agent.permissions.map((permission) => (
                        <div key={permission} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getPermissionIcon(permission)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {formatPermissionName(permission)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Access to {permission.split(':')[0]} data
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            getPermissionRisk(permission) === 'Medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {getPermissionRisk(permission)} risk
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="text-sm">
                    <p className="text-gray-700">
                      I agree to grant these permissions and accept the{' '}
                      <a href={agent.termsUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 underline">
                        Terms of Service
                      </a>
                      {agent.privacyUrl && (
                        <>
                          {' '}and{' '}
                          <a href={agent.privacyUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 underline">
                            Privacy Policy
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'installing' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Installing {agent.name}</h4>
                <p className="text-sm text-gray-600">This may take a few moments...</p>
              </div>
            )}

            {currentStep === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {agent.name} installed successfully!
                </h4>
                <p className="text-sm text-gray-600 mb-6">
                  Your new AI agent is ready to help. You can find it in your installed agents.
                </p>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">What&apos;s next?</h5>
                  <ul className="text-sm text-blue-800 space-y-1 text-left">
                    <li>• Configure the agent settings to match your needs</li>
                    <li>• Test the agent with a sample interaction</li>
                    <li>• Monitor its performance in the dashboard</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            {currentStep === 'permissions' && (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInstall}
                  disabled={!agreedToTerms}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Install Agent
                </button>
              </>
            )}
            
            {currentStep === 'success' && (
              <>
                <button
                  onClick={() => {/* Navigate to agent settings */}}
                  className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200"
                >
                  Configure Agent
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}