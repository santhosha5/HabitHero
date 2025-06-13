import React, { useState, useEffect } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Location {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface LocationReminderProps {
  habitId: string;
  initialLocations?: Location[];
  onSave: (locations: Location[]) => Promise<void>;
}

export default function LocationReminder({
  habitId,
  initialLocations = [],
  onSave,
}: LocationReminderProps) {
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [newLocation, setNewLocation] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Update locations if props change
    if (initialLocations) {
      setLocations(initialLocations);
    }
  }, [initialLocations]);

  const handleAddLocation = async () => {
    if (!newLocation.trim()) return;

    setIsLoading(true);
    try {
      const location: Location = {
        id: `loc_${Date.now()}`,
        name: newLocation,
      };

      // If we have current location, add coordinates
      if (currentLocation) {
        location.latitude = currentLocation.coords.latitude;
        location.longitude = currentLocation.coords.longitude;
      }

      const updatedLocations = [...locations, location];
      setLocations(updatedLocations);
      setNewLocation('');
      await onSave(updatedLocations);
    } catch (error) {
      toast.error('Failed to add location');
      console.error('Error adding location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLocation = async (id: string) => {
    try {
      const updatedLocations = locations.filter(loc => loc.id !== id);
      setLocations(updatedLocations);
      await onSave(updatedLocations);
    } catch (error) {
      toast.error('Failed to remove location');
      console.error('Error removing location:', error);
    }
  };

  const getCurrentPosition = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position);
          toast.success('Current location captured');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  return (
    <div className="mt-4 border rounded-md p-4 bg-gray-50">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <MapPinIcon className="h-5 w-5 text-primary-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-700">
            Location Reminders
          </h3>
        </div>
        <span className="text-gray-500 text-sm">
          {locations.length > 0 ? `${locations.length} location(s)` : 'None set'}
        </span>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-gray-500">
            Add locations where you want to be reminded about this habit.
            We'll notify you when you're near these places.
          </p>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              placeholder="Location name (e.g. Home, Office)"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
            />
            <button
              type="button"
              onClick={getCurrentPosition}
              className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              title="Use current location"
            >
              <MapPinIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleAddLocation}
              disabled={isLoading || !newLocation.trim()}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>

          {locations.length > 0 && (
            <ul className="mt-2 divide-y divide-gray-200">
              {locations.map((location) => (
                <li key={location.id} className="py-2 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{location.name}</p>
                    {location.latitude && location.longitude && (
                      <p className="text-xs text-gray-500">
                        Coordinates: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(location.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}