# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "williamyeh/ubuntu-trusty64-docker"
  config.vm.box_version = "1.12.1.20160830"

  # port forward
  (4567..4581).to_a.push(8888).each do |port|
    config.vm.network "forwarded_port", guest: port, host: port, host_ip: "127.0.0.1"
  end
  config.vm.network "private_network", ip: "192.168.33.10"

  # provider
  config.vm.provider "virtualbox" do |vb|
    vb.memory = "2048"
#    vb.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]
  end

  # provisioning
  config.vm.provision "ansible_local" do |ansible|
    ansible.playbook = "ansible/playbook.yml"
    ansible.verbose = "-v"
  end
end

