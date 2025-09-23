import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Star } from 'lucide-react-native';
import { Colors } from '../theme/colors';

export interface RatingData {
  rating: number;
  comment?: string;
}

interface RatingProps {
  title: string;
  subtitle?: string;
  onRatingSubmit: (data: RatingData) => void;
  onCancel?: () => void;
  initialRating?: number;
  showComment?: boolean;
  isLoading?: boolean;
  maxRating?: number;
}

const Rating: React.FC<RatingProps> = ({
  title,
  subtitle,
  onRatingSubmit,
  onCancel,
  initialRating = 0,
  showComment = true,
  isLoading = false,
  maxRating = 5
}) => {
  const [selectedRating, setSelectedRating] = useState(initialRating);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (selectedRating === 0) {
      return; // Don't allow 0 star ratings
    }

    onRatingSubmit({
      rating: selectedRating,
      comment: showComment ? comment.trim() : undefined
    });
  };

  const getRatingText = (rating: number): string => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Rate your experience';
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= maxRating; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          style={styles.starButton}
          onPress={() => setSelectedRating(i)}
          disabled={isLoading}
        >
          <Star
            size={32}
            color={i <= selectedRating ? '#FFD700' : Colors.border.light}
            fill={i <= selectedRating ? '#FFD700' : 'transparent'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        {/* Star Rating */}
        <View style={styles.starsContainer}>
          <View style={styles.stars}>{renderStars()}</View>
          <Text style={styles.ratingText}>
            {getRatingText(selectedRating)}
          </Text>
        </View>

        {/* Comment Section */}
        {showComment && (
          <View style={styles.commentSection}>
            <Text style={styles.commentLabel}>
              Tell us more about your experience (Optional)
            </Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Share your thoughts..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
              placeholderTextColor={Colors.text.placeholder}
              editable={!isLoading}
            />
            <Text style={styles.characterCount}>{comment.length}/500</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {onCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.submitButton,
              selectedRating === 0 && styles.disabledButton,
              isLoading && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={selectedRating === 0 || isLoading}
          >
            <Text style={[
              styles.submitButtonText,
              (selectedRating === 0 || isLoading) && styles.disabledButtonText
            ]}>
              {isLoading ? 'Submitting...' : 'Submit Rating'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  starsContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
    marginHorizontal: 2,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary.main,
  },
  commentSection: {
    marginBottom: 24,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'right',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.secondary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary.main,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.white,
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.text.light,
  },
  disabledButtonText: {
    color: Colors.text.secondary,
  },
});

export default Rating;
