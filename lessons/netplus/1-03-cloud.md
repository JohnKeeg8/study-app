# Cloud concepts

## Service models: who manages what

| Model | You manage | Provider manages | Example |
|---|---|---|---|
| **IaaS** | OS, apps, data, network config | Hardware, virtualization, facility | Virtual machines (EC2, Azure VMs) |
| **PaaS** | Your application and data | OS, runtime, middleware, and below | App hosting platforms |
| **SaaS** | Just your data and users | Everything else | Microsoft 365, Gmail |

Control decreases and convenience increases from IaaS → PaaS → SaaS. Under the **shared responsibility model**, the provider always secures the physical data center. The customer always owns their data, identities, and access rules.

## Deployment models

- **Public:** shared, multitenant infrastructure from a provider. Pay as you go.
- **Private:** dedicated to one organization, on-premises or hosted.
- **Hybrid:** private and public working together. *Cloud bursting* sends overflow to the public cloud.
- **Community:** shared by organizations with common needs, such as compliance.
- **Multicloud:** more than one public provider.

## Cloud networking pieces

- **VPC (virtual private cloud):** your logically isolated network in the cloud, with its own subnets and route tables.
- **Network security group / security group:** a **stateful** virtual firewall on instances or interfaces. Return traffic is automatic.
- **Network ACL:** a **stateless** subnet-level filter. Return traffic must be allowed explicitly.
- **Internet gateway:** two-way internet access for public subnets. A subnet is "public" because its route table sends 0.0.0.0/0 to the internet gateway.
- **NAT gateway:** lets private subnets reach the internet outbound only.
- **VPN gateway / Direct Connect / ExpressRoute:**
  - A VPN gateway gives an encrypted tunnel over the internet.
  - Direct Connect and ExpressRoute are private dedicated links.
- **VPC peering / transit gateway:** connect VPCs. Peering is not transitive; a transit gateway acts as a hub.

## NFV

**Network functions virtualization** runs routers, firewalls, and load balancers as software (**VNFs**) on standard servers instead of dedicated appliances.

## Cloud characteristics

- **Elasticity:** resources scale up and down automatically with demand.
- **Multitenancy:** many customers share hardware but are logically isolated.
- **Metered service:** you pay for what you use, an operating expense rather than a capital one.
- **Availability zones:** separate data centers within a region, for high availability.

> **Exam tip:** "Customer patches the OS" → IaaS. "Developers just deploy code" → PaaS. "Use the finished app in a browser" → SaaS. Security groups are stateful; NACLs are stateless.
