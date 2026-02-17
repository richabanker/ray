"""Infrastructure detection and information gathering for Ray dashboard.

This module provides platform-agnostic infrastructure detection and data collection
to help troubleshoot Ray clusters running on different platforms like Kubernetes,
Docker, cloud providers, etc.
"""

import logging
import os
import socket
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)


class PlatformInfo:
    """Container for platform information."""
    
    def __init__(self, platform_type: str, platform_version: Optional[str] = None):
        self.platform_type = platform_type
        self.platform_version = platform_version
        self.details: Dict[str, Any] = {}
        
    def add_detail(self, key: str, value: Any) -> None:
        """Add platform-specific detail."""
        self.details[key] = value
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "platform_type": self.platform_type,
            "platform_version": self.platform_version,
            "details": self.details
        }


class InfrastructureCollector(ABC):
    """Base class for platform-specific infrastructure collectors."""
    
    @abstractmethod
    def collect(self) -> Dict[str, Any]:
        """Collect infrastructure information for this platform."""
        pass


class KubernetesCollector(InfrastructureCollector):
    """Collects Kubernetes-specific infrastructure information."""
    
    def __init__(self):
        pass
    
    def _get_pod_name(self) -> str:
        """Get the pod name from MY_POD_NAME environment variable.
        
        MY_POD_NAME is Ray's convention, set via Kubernetes Downward API.
        """
        return os.environ.get("MY_POD_NAME", "unknown")
        
    def _get_namespace(self) -> str:
        """Get the current namespace."""
        try:
            # Try to read namespace from service account
            with open("/var/run/secrets/kubernetes.io/serviceaccount/namespace", "r") as f:
                return f.read().strip()
        except FileNotFoundError:
            return os.environ.get("POD_NAMESPACE", "default")
    
    def collect(self) -> Dict[str, Any]:
        """Collect basic Kubernetes information."""
        info = {
            "pod_name": self._get_pod_name(),
            "namespace": self._get_namespace(),
            "node_name": os.environ.get("NODE_NAME"),
            "service_account": self._get_service_account(),
        }
        return info
    
    def _get_service_account(self) -> Optional[str]:
        """Get the service account name."""
        try:
            # This is a simplified approach - in a full implementation,
            # we'd parse the service account token
            return "default"  # placeholder
        except Exception:
            return None


class ContainerCollector(InfrastructureCollector):
    """Collects container-specific infrastructure information."""
    
    def collect(self) -> Dict[str, Any]:
        """Collect basic container information."""
        info = {
            "hostname": socket.gethostname(),
            "container_id": self._get_container_id(),
        }
        
        # Add cgroup information
        info["cgroup_info"] = self._get_cgroup_info()
        return info
    
    def _get_container_id(self) -> Optional[str]:
        """Extract container ID from cgroup."""
        try:
            with open("/proc/self/cgroup", "r") as f:
                for line in f:
                    if "docker" in line or "containerd" in line:
                        # Extract container ID from cgroup path
                        parts = line.strip().split("/")
                        if len(parts) > 1:
                            return parts[-1][:12]  # First 12 chars like docker ps
        except FileNotFoundError:
            pass
        return None
    
    def _get_cgroup_info(self) -> Dict[str, str]:
        """Get basic cgroup information."""
        info = {}
        try:
            # Check if we're in cgroups v1 or v2
            if os.path.exists("/sys/fs/cgroup/memory"):
                info["cgroup_version"] = "v1"
            elif os.path.exists("/sys/fs/cgroup/cgroup.controllers"):
                info["cgroup_version"] = "v2"
            else:
                info["cgroup_version"] = "unknown"
        except Exception:
            info["cgroup_version"] = "error"
        
        return info


class InfrastructureDetector:
    """Detects the current infrastructure platform and collects relevant information."""
    
    def __init__(self):
        self._detected_platform: Optional[PlatformInfo] = None
        self._collector: Optional[InfrastructureCollector] = None
    
    def detect_platform(self) -> PlatformInfo:
        """Detect the current platform and return platform information."""
        if self._detected_platform is not None:
            return self._detected_platform
        
        # Check for Kubernetes
        if self._is_kubernetes():
            self._detected_platform = PlatformInfo("kubernetes")
            self._collector = KubernetesCollector()
            
            # Add Kubernetes cluster info
            k8s_host = os.environ.get("KUBERNETES_SERVICE_HOST")
            k8s_port = os.environ.get("KUBERNETES_SERVICE_PORT", "443")
            self._detected_platform.add_detail("api_server", f"{k8s_host}:{k8s_port}")
            
        # Check for Docker/container (but not Kubernetes)
        elif self._is_container():
            self._detected_platform = PlatformInfo("container")
            self._collector = ContainerCollector()
            
        # Default to bare metal/VM
        else:
            self._detected_platform = PlatformInfo("bare_metal")
            self._collector = None
        
        return self._detected_platform
    
    def collect_infrastructure_info(self) -> Dict[str, Any]:
        """Collect infrastructure information for the detected platform."""
        platform = self.detect_platform()
        
        base_info = {
            "platform": platform.to_dict(),
            "hostname": socket.gethostname(),
        }
        
        if self._collector:
            try:
                platform_specific = self._collector.collect()
                base_info["platform_details"] = platform_specific
            except Exception as e:
                logger.warning(f"Failed to collect platform-specific info: {e}")
                base_info["platform_details"] = {"error": str(e)}
        
        return base_info
    
    @staticmethod
    def _is_kubernetes() -> bool:
        """Check if running in Kubernetes."""
        return "KUBERNETES_SERVICE_HOST" in os.environ
    
    @staticmethod
    def _is_container() -> bool:
        """Check if running in a container (but not Kubernetes).
        Find a better way to detect this.
        """
        return os.path.exists("/sys/fs/cgroup")


# Global instance for use by reporter agents
infrastructure_detector = InfrastructureDetector()