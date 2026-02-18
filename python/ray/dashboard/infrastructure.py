import os
import json
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)


class InfrastructureMetadataParser:
    """
    Blindly reads infrastructure metadata injected by the deployment platform
    (e.g., KubeRay, AWS UserData scripts) and passes it to the dashboard.
    """
    
    def collect_infrastructure_info(self) -> Dict[str, Any]:
        """Collect infrastructure information from injected environment variables."""
        metadata = {}
        
        # Ray explicitly expects the deploying platform to inject this variable
        # e.g., '{"platformType": "kubernetes", "podName": "ray-worker-1", "namespace": "default"}'
        injected_tags = os.environ.get("RAY_INFRASTRUCTURE_TAGS")
        
        if injected_tags:
            try:
                metadata = json.loads(injected_tags)
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse RAY_INFRASTRUCTURE_TAGS: {e}")
            except Exception as e:
                logger.warning(f"Unexpected error parsing RAY_INFRASTRUCTURE_TAGS: {e}")
                
        return metadata


# Global instance for use by reporter agents
infrastructure_detector = InfrastructureMetadataParser()
